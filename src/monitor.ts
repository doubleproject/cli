/**
 * This file implements a monitor process for network nodes. It takes a path to
 * a writeable jsonline file (.jl) as configuration. Each line should define a
 * json object corresponding to the interface `IMonitoredNodeConfig`. The
 * monitor process may modify the file and add more objects to it.
 */

import * as ChildProcess from 'child_process';
import * as fs from 'fs-extra';
import * as http from 'http';

import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as getPort from 'get-port';
import * as _ from 'lodash';
import * as readline from 'readline';
import * as rp from 'request-promise';
import * as winston from 'winston';

interface IMonitoredNodeConfig {
  /**
   * The rpc address of the monitored node. In IP:port format.
   */
  address: string;

  /**
   * The project this node belongs to.
   */
  project: string;

  /**
   * The environment this node belongs to.
   */
  environment: string;

  /**
   * A command that can be used to start/restart the node.  If `undefined`, the
   * the monitor will not try to restart the node.
   */
  reviveCmd?: string;

  /**
   * The arguments that should be passed to the cmd above, seperated by space.
   */
  reviveArgs?: string;
}

/**
 * Takes any object and checks if it conforms to the config interface.
 */
function validateMonitoredNodeConfig(data: any): IMonitoredNodeConfig {
  if (typeof(data.address) !== 'string') {
    throw new Error('address is not a string');
  }

  if (typeof(data.project) !== 'string') {
    throw new Error('project is not a string');
  }

  if (typeof(data.environment) !== 'string') {
    throw new Error('environment is not a string');
  }

  if (data.reviveCmd &&
      typeof(data.reviveCmd) !== 'string') {
    throw new Error('invalid reviveCmd field');
  }

  if (data.reviveArgs &&
      typeof(data.reviveArgs) !== 'string') {
    throw new Error('invalid reviveArgs field');
  }

  return data;
}

/**
 * An internal interface representing the state we keep track of for each
 * network node.
 */
export interface IMonitoredNodeStatus {
  address: string;
  alive: boolean;
  lastUpdate: Date;
  lastResponseId: number;
  failureCount: number;
  networkId?: string;
  reviveCmd?: string;
  reviveArgs?: string[];
  project: string;
  environment: string;
}

/**
 * An internal interface representing the response of the ping command to the
 * network node.
 */
interface INetVersionResponse {
  id: number;
  result: string;
}

const K_MONITOR_START_PORT = 9545;
const K_MONITOR_END_PORT   = 9644;

/**
 * Scans the ports and returns the first available port between 9545 and
 * 9644. If no port is available within this range, throws exception.
 */
export async function getFirstAvailablePortForMonitor(): Promise<number> {
  const port = await getPort({ port: K_MONITOR_START_PORT });
  if (port > K_MONITOR_END_PORT) {
    throw new Error('No available port for monitor');
  }
  return port;
}

/**
 * Scans all ports in the range [start, end) concurrently, if any one of the
 * port resembles a monitor process, return that port number. If none of them
 * looks like a monitor, throws exception.
 */
async function scanPort(port: number): Promise<number> {
  const response = await rp.get(`http://localhost:${port}/status`, { resolveWithFullResponse: true });
  if (response.headers.server === 'double-monitor') {
    return port;
  }
  throw new Error(`${port} is not a double monitor port.`);
}

/**
 * Scans the ports between 9545 and 9644, and returns the first port where a
 * monitor process is listening.
 */
export async function scanForMonitor(): Promise<number> {
  const portRange = _.range(K_MONITOR_START_PORT, K_MONITOR_END_PORT);
  for (const port of portRange) {
    try {
      const confirmedPort =
        await Promise.race([scanPort(port),
                            new Promise<number>((resolve, reject) => setTimeout(
                              () => { reject(new Error('Scan timed out')); },
                              1000)),
                           ]);
      return confirmedPort;
    } catch (e) {
      // Just suppress the exception.
    }
  }

  throw new Error('Cannot find a double monitor process running');
}

/**
 * The actual monitor implementation. It contains an express application and
 * last known node status.
 */
export class Monitor {
  /**
   * The interval at which the monitor pings the instances. If the last update
   * time was longer than this interval, the instance is considered dead.
   */
  private heartbeatInterval: number;

  /**
   * Number of failures the monitor should tolerate before considering a node as
   * dead.
   */
  private failureTolerance: number;

  /** Path to the configuration file. */
  private configPath: string;

  /** The express app */
  private app: express.Application;

  /** The http server */
  private server?: http.Server;

  /** The current state of the nodes */
  private nodeStatuses: IMonitoredNodeStatus[];

  /** The timer used to ping nodes */
  private timer?: NodeJS.Timer;

  /**
   * Construct a monitor for the given nodes, open an HTTP server on the given
   * port for incoming requests.
   *
   * @param nodes The configurations for each monitored node
   * @param configPath The path to the configuration file
   * @param heartbeatInterval Number of milliseconds between each ping request
   * @param failureTolerance Number of failures monitor should tolerate before
   *    considering a node dead, and trying to revive it.
   */
  constructor(nodes: IMonitoredNodeConfig[],
              configPath: string,
              heartbeatInterval?: number,
              failureTolerance?: number) {
    this.app = express();
    this.setupRouting();
    this.server = undefined;
    this.timer = undefined;

    this.nodeStatuses = [];

    // Why do we pass both config data and config path in? Because the
    // constructor cannot be asynchronous... And since parsing the configuration
    // can potentially block, we don't want to parse that data synchronously
    // either. This is a compromise.
    this.configPath = configPath;
    for (const node of nodes) {
      this.nodeStatuses.push(this.configToInitialNodeStatus(node));
    }

    if (typeof heartbeatInterval !== 'undefined') {
      if (heartbeatInterval < 1000) {
        throw new Error('Heartbeat interval must be at least 1000 milliseconds');
      }
      this.heartbeatInterval = heartbeatInterval;
    } else {
      this.heartbeatInterval = 5000;
    }

    if (typeof failureTolerance !== 'undefined') {
      if (failureTolerance < 1) {
        throw new Error('failureTolerance must be at least 1');
      }
      this.failureTolerance = failureTolerance;
    } else {
      this.failureTolerance = 1;
    }
  }

  /**
   * Start the embedded HTTP server to process requests on the given port.
   */
  public async start(port: number): Promise<void> {
    this.timer = this.createPingTimer();
    this.ping();

    return new Promise<void>(resolve => {
      this.server = http.createServer(this.app);
      this.server.listen(port, () => resolve());
    });
  }

  /**
   * Stop the HTTP server.
   */
  public async stop(): Promise<void> {
    if (typeof this.timer !== 'undefined') {
      clearInterval(this.timer);
      this.timer = undefined;
    }

    return new Promise<void>(resolve => {
      if (typeof this.server !== 'undefined') {
        this.server.close(() => resolve());
        this.server = undefined;
      } else {
        resolve();
      }
    });
  }

  private validateNetVersionResponse(data: any): INetVersionResponse {
    if (!data.hasOwnProperty('id')) {
      throw new Error('response does not contain id field');
    }

    if (typeof data.id !== 'number') {
      throw new Error('id is not a number');
    }

    if (!data.hasOwnProperty('result')) {
      throw new Error('response does not contain result field');
    }

    return data as INetVersionResponse;
  }

  /**
   * Generates the initial status for a node given a monitored node's
   * configuration.
   */
  private configToInitialNodeStatus(config: IMonitoredNodeConfig): IMonitoredNodeStatus {
    const result: IMonitoredNodeStatus = {
      address: config.address,
      alive: false,
      lastUpdate: new Date(),
      lastResponseId: 0,
      failureCount: 0,
      project: config.project,
      environment: config.environment,
    };

    if (typeof config.reviveCmd !== 'undefined') {
      result.reviveCmd = config.reviveCmd;
    }

    if (typeof config.reviveArgs !== 'undefined') {
      result.reviveArgs = config.reviveArgs.split(/\s+/);
    }

    return result;
  }

  /**
   * Append the configurations to the configuration jsonline file.
   */
  private appendConfigData(nodes: IMonitoredNodeConfig[]) {
    const file = fs.createWriteStream(this.configPath, {
      flags: 'a',
    });

    nodes.forEach(node => {
      const configLine = JSON.stringify(node);
      file.write(configLine + '\n');
    });

    file.end();
  }

  private setupRouting() {
    // Set a server header to identify the monitor itself.
    this.app.use((req, resp, next) => {
      resp.setHeader('Server', 'double-monitor');
      next();
    });

    // GET /status returns the current status of all known instances.
    this.app.get('/status/:project?/:environment?', (req, res) => {
      const proj = req.params.project;
      const env  = req.params.environment;

      let results = this.nodeStatuses;
      if (typeof(proj) !== 'undefined') {
        results = results.filter(node => node.project === proj);
      }
      if (proj && typeof(env) !== 'undefined') {
        results = results.filter(node => node.environment === env);
      }

      res.send(results);
    });

    // Parse all request body as JSON, ignoring content-type, for the /add
    // route.
    this.app.use('/add', bodyParser.json());

    // POST /add adds the provided instances to the monitored list. The POST
    // data must be a JSON object with the following format.
    // {
    //   nodes: [IMonitoredNodeConfig...]
    // }
    this.app.post('/add', (req, res) => {

      winston.info(req.body);

      if (!(req.body.nodes instanceof Array)) {
        res.status(400).send('The field nodes is not an array.');
        return;
      }

      const validConfigs = [];
      try {
        for (const data of req.body.nodes) {
          const monitoredNodeConfig = validateMonitoredNodeConfig(data);
          this.nodeStatuses.push(
            this.configToInitialNodeStatus(monitoredNodeConfig));
          validConfigs.push(monitoredNodeConfig);
          this.appendConfigData(validConfigs);
          res.status(200).send('Ok');
        }
      } catch (err) {
        res.status(400).send(
          `${req.body} contains invalid configuration, error: ${err}`);
      }
    });
  }

  private tryRevive(node: IMonitoredNodeStatus) {
    if (node.failureCount < this.failureTolerance) {
      winston.info(
        `${node.address} hasn't reached failure threshold, not reviving...`);
      return;
    }

    if (typeof node.reviveCmd === 'undefined') {
      winston.info(`${node.address} doesn't have a revive command...`);
      return;
    }

    let args: string[] = [];
    if (typeof node.reviveArgs !== 'undefined') {
      args = node.reviveArgs;
    }

    const child = ChildProcess.spawn(node.reviveCmd, args, {
      detached: true,
      stdio: 'ignore',
    });

    child.unref();
  }

  private async ping() {
    for (const node of this.nodeStatuses) {
      // https://github.com/ethereum/wiki/wiki/JSON-RPC#net_version
      // We use this simple API as a PING to the network.

      try {
        const body = await rp.post(`http://${node.address}`, {
          headers: {
            'content-type': 'application/json',
          },
          json: {
            jsonrpc: '2.0',
            method: 'net_version',
            params: [],
            // We should ignore any response whose id is smaller than the last
            // response id to linearize the communication between the monitor
            // and the network nodes.
            id: node.lastResponseId + 1,
          },
        });

        const nodeResp = this.validateNetVersionResponse(body);
        if (nodeResp.id > node.lastResponseId) {
          // Ignore stale responses by checking the request/response id
          node.alive = true;
          node.networkId = nodeResp.result;
          node.lastUpdate = new Date();
          node.failureCount = 0;
          node.lastResponseId = nodeResp.id;
        }
      } catch (err) {
        winston.error(
          `Failed to contact node at ${node.address}, reason: ${err}`);
        node.alive = false;
        node.failureCount++;
        this.tryRevive(node);
      }
    }
  }

  private createPingTimer(): NodeJS.Timer {
    return setInterval(() => {
      this.ping();
    }, this.heartbeatInterval);
  }

}

/**
 * Read the configuration file asynchronously and return the result.
 */
async function parseConfigs(path: string): Promise<IMonitoredNodeConfig[]> {
  const result = new Promise<IMonitoredNodeConfig[]>((resolve, reject) => {
    const configs: IMonitoredNodeConfig[] = [];

    const readStream = fs.createReadStream(path);
    readStream.on('error', err => {
      reject(`Failed to read configuration: ${err}`);
    });

    const lineReader = readline.createInterface({
      input: readStream,
    });

    lineReader.on('line', line => {
      winston.verbose(line);
      try {
        const data = JSON.parse(line);
        const config = validateMonitoredNodeConfig(data);
        configs.push(config);
      } catch (err) {
        reject(`Failed to parse configuration data: ${err}`);
      }
    });

    lineReader.on('close', () => {
      resolve(configs);
    });
  });

  return result;
}

if (require.main === module) {
  if (process.argv.length < 4) {
    throw new Error('monitor <port> <configPath> <logPath>');
  }

  const port = process.argv[2];
  const configPath = process.argv[3];
  const logPath = process.argv[4];

  winston.add(winston.transports.File, {
    filename: logPath,
  });
  winston.remove(winston.transports.Console);

  winston.info(`Using configuration at: ${configPath}`);

  const portNum = parseInt(port, 10);

  if (isNaN(portNum)) {
    winston.error('Please pass a number for the port argument');
  }

  parseConfigs(configPath)
    .then(configs => {
      winston.info(JSON.stringify(configs));
      const monitor = new Monitor(configs, configPath);
      monitor.start(portNum);
    })
    .catch(err => {
      winston.error(err);
      process.exit(1);
    });
}
