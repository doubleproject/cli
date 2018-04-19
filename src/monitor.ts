/**
 * This file implements a monitor process for network nodes. It takes a path to
 * a writeable jsonline file (.jl) as configuration. Each line should define a
 * json object corresponding to the interface `IMonitoredNodeConfig`. The
 * monitor process may modify the file and add more objects to it.
 */

import * as bodyParser from 'body-parser';
import * as program from 'commander';
import * as express from 'express';
import * as readline from 'readline';
import * as request from 'request';
import * as winston from 'winston';

import * as ChildProcess from 'child_process';
import * as fs from 'fs';
import * as http from 'http';

const enableDestroy = require('server-destroy');

interface IMonitoredNodeConfig {
  /**
   * The rpc address of the monitored node. In IP:port format.
   */
  address: string;

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
function validateMonitoredNodeConfig(data: any): IMonitoredNodeConfig | undefined {
  if (!data.hasOwnProperty('address')) {
    return undefined;
  }

  if (typeof(data.address) !== 'string') {
    return undefined;
  }

  if (data.hasOwnProperty('reviveCmd') &&
      typeof(data.reviveCmd) !== 'string') {
    return undefined;
  }

  if (data.hasOwnProperty('reviveArgs') &&
      typeof(data.reviveArgs) !== 'string') {
    return undefined;
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
  networkId?: string;
  reviveCmd?: string;
  reviveArgs?: string[];
}

/**
 * An internal interface representing the response of the ping command to the
 * network node.
 */
interface INetVersionResponse {
  id: number;
  result: string;
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
  private static K_HEARTBEAT_INTERVAL = 5000;

  /**
   * The express app
   */
  private app: express.Application;

  /**
   * The http server
   */
  private server?: http.Server;

  /**
   * The current state of the nodes
   */
  private nodesStatus: IMonitoredNodeStatus[];

  /**
   * The timer used to ping nodes
   */
  private timer?: NodeJS.Timer;

  /**
   * Construct a monitor for the given nodes, open an HTTP server on the given
   * port for incoming requests.
   */
  constructor(nodes: IMonitoredNodeConfig[]) {
    this.app = express();
    this.setupRouting();
    this.server = undefined;
    this.timer = undefined;

    this.nodesStatus = [];
    for (const node of nodes) {
      this.nodesStatus.push(this.configToInitialNodeStatus(node));
    }
  }

  /**
   * Start the embedded HTTP server to process requests on the given port.
   */
  public start(port: number) {
    this.timer = this.createPingTimer();
    this.ping();

    this.server =
      enableDestroy(this.app.listen(port));
  }

  /**
   * Stop the HTTP server.
   */
  public stop() {
    if (typeof this.timer !== 'undefined') {
      clearInterval(this.timer);
      this.timer = undefined;
    }

    if (typeof this.server !== 'undefined') {
      this.server.destroy();
      this.server = undefined;
    }
  }

  private validateNetVersionResponse(data: any): INetVersionResponse | undefined {
    if (!data.hasOwnProperty('id')) {
      return undefined;
    }

    if (typeof data.id !== 'number') {
      return undefined;
    }

    if (!data.hasOwnProperty('result')) {
      return undefined;
    }

    return data as INetVersionResponse;
  }

  private configToInitialNodeStatus(config: IMonitoredNodeConfig): IMonitoredNodeStatus {
    const result: IMonitoredNodeStatus = {
      address: config.address,
      alive: false,
      lastUpdate: new Date(),
      lastResponseId: 0,
    };

    if (typeof config.reviveCmd !== 'undefined') {
      result.reviveCmd = config.reviveCmd;
    }

    if (typeof config.reviveArgs !== 'undefined') {
      result.reviveArgs = config.reviveArgs.split(/\s+/);
    }

    return result;
  }

  private setupRouting() {
    // GET /status returns the current status of all known instances.
    this.app.get('/status', (req, res) => {
      res.send(this.nodesStatus);
    });

    // Parse all request body as JSON, ignoring content-type, for the /add
    // route.
    this.app.use('/add', bodyParser.json({
      type: '*/*',
    }));

    // POST /add adds the provided instances to the monitored list. The POST
    // data must be a JSON object with the following format.
    // {
    //   nodes: [IMonitoredNodeConfig...]
    // }
    this.app.post('/add', (req, res) => {

      winston.info(req.body);

      if (!req.body.hasOwnProperty('nodes')) {
        res.status(400).send('There is no field named nodes.');
        return;
      }

      if (!(req.body.nodes instanceof Array)) {
        res.status(400).send('The field nodes is not an array.');
        return;
      }

      for (const data of req.body.nodes) {
        const monitoredNodeConfig = validateMonitoredNodeConfig(data);

        if (typeof monitoredNodeConfig === 'undefined') {
          res.status(400).send(`${JSON.stringify(data)} is not a valid configuration.`);
          return;
        }

        this.nodesStatus.push(this.configToInitialNodeStatus(monitoredNodeConfig));
      }

      res.status(200).send('Ok');
    });
  }

  private tryRevive(node: IMonitoredNodeStatus) {
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

  private ping() {
    for (const node of this.nodesStatus) {
      // https://github.com/ethereum/wiki/wiki/JSON-RPC#net_version
      // We use this simple API as a PING to the network.
      request
        .post(`http://${node.address}`, {
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
        }, (err, resp, body) => {
          if (err) {
            winston.error(`Failed to contact node at ${node.address}, reason: ${err}`);
            node.alive = false;
            this.tryRevive(node);
            return;
          }

          const nodeResp = this.validateNetVersionResponse(body);
          if (typeof nodeResp === 'undefined') {
            winston.info(`Node ${node.address} returned invalid response: ${body}`);
            node.alive = false;
            this.tryRevive(node);
          } else if (nodeResp.id > node.lastResponseId) {
            // Ignore stale responses by checking the request/response id
            node.alive = true;
            node.networkId = nodeResp.result;
            node.lastUpdate = new Date();
            node.lastResponseId = nodeResp.id;
          }
        });
    }
  }

  private createPingTimer(): NodeJS.Timer {
    return setInterval(() => {
      this.ping();
    }, Monitor.K_HEARTBEAT_INTERVAL);
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

        if (typeof config !== 'undefined') {
          configs.push(config);
        } else {
          reject(`Invalid configuration data: ${line}`);
        }
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
  program
    .usage('<port> <configpath> <logpath>')
    .action(async (port: string, configPath: string, logPath: string) => {
      winston.add(winston.transports.File, {
        filename: logPath,
      });
      winston.remove(winston.transports.Console);

      winston.info(`Using configuration at: ${configPath}`);

      const portNum = parseInt(port, 10);

      if (isNaN(portNum)) {
        winston.error('Please pass a number for the port argument');
      }

      try {
        const configs = await parseConfigs(configPath);
        winston.info(JSON.stringify(configs));
        const monitor = new Monitor(configs);
        monitor.start(portNum);
      } catch (err) {
        winston.error(err);
        process.exit(1);
      }
    });

  program.parse(process.argv);

  if (program.args.length < 4) {
    program.help();
    process.exit(1);
  }
}
