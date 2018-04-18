/**
 * This file implements a monitor process for network nodes. It takes a path to
 * a writeable jsonline file (.jl) as configuration. Each line should define a
 * json object corresponding to the interface `IMonitoredNodeConfig`. The
 * monitor process may modify the file and add more objects to it.
 */

import * as express      from 'express';
import * as winston      from 'winston';
import * as program      from 'commander';
import * as readline     from 'readline';
import * as fs           from 'fs';
import * as request      from 'request';
import * as bodyParser   from 'body-parser';
import * as ChildProcess from 'child_process';

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
};


/**
 * Takes any object and checks if it conforms to the config interface.
 */
function validateMonitoredNodeConfig(data: any) : IMonitoredNodeConfig | undefined {
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
};

/**
 * An internal interface representing the state we keep track of for each
 * network node.
 */
interface IMonitoredNodeStatus {
  address: string;
  alive: boolean;
  lastUpdate: Date;
  lastResponseId: number;
  networkId?: string;
  reviveCmd?: string;
  reviveArgs?: string[];
};

/**
 * An internal interface representing the response of the ping command to the
 * network node.
 */
interface INetVersionResponse {
  id: number;
  result: string;
};

/**
 * The actual monitor implementation. It contains an express application and
 * last known node status.
 */
class Monitor {
  /**
   * The interval at which the monitor pings the instances. If the last update
   * time was longer than this interval, the instance is considered dead.
   */
  static k_HEARTBEAT_INTERVAL = 5000;

  /**
   * The web server
   */
  server: express.Application;

  /**
   * The current state of the nodes
   */
  nodesStatus: IMonitoredNodeStatus[];

  /**
   * The timer used to ping nodes
   */
  timer: NodeJS.Timer;

  private validateNetVersionResponse(data: any) : INetVersionResponse | undefined {
    if (!data.hasOwnProperty('id')) {
      return undefined;
    }

    if (typeof data.id !== 'number') {
      return undefined;
    }

    if (!data.hasOwnProperty('result')) {
      return undefined;
    }

    return <INetVersionResponse>data;
  }

  private configToInitialNodeStatus(config: IMonitoredNodeConfig) : IMonitoredNodeStatus {
    var result : IMonitoredNodeStatus = {
      address: config.address,
      alive: false,
      lastUpdate: new Date(),
      lastResponseId: 0
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
    this.server.get('/status', (req, res) => {
      res.send(this.nodesStatus);
    });

    // Parse all request body as JSON, ignoring content-type, for the /add
    // route.
    this.server.use('/add', bodyParser.json({
      type: '*/*'
    }));

    // POST /add adds the provided instances to the monitored list. The POST
    // data must be a JSON object with the following format.
    // {
    //   nodes: [IMonitoredNodeConfig...]
    // }
    this.server.post('/add', (req, res) => {

      winston.info(req.body);

      if (!req.body.hasOwnProperty('nodes')) {
        res.status(404).send('There is no field named nodes.');
        return;
      }

      if (!(req.body.nodes instanceof Array)) {
        res.status(404).send('The field nodes is not an array.');
        return;
      }

      for (let data of req.body.nodes) {
        const monitoredNodeConfig = validateMonitoredNodeConfig(data);

        if (typeof monitoredNodeConfig === 'undefined') {
          res.status(404).send(`${JSON.stringify(data)} is not a valid configuration.`);
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

    var args : string[] = [];
    if (typeof node.reviveArgs !== 'undefined') {
      args = node.reviveArgs;
    }

    const child = ChildProcess.spawn(node.reviveCmd, args, {
      detached: true,
      stdio: 'ignore'
    });

    child.unref();
  }

  private ping() {
    for (let node of this.nodesStatus) {
      // https://github.com/ethereum/wiki/wiki/JSON-RPC#net_version
      // We use this simple API as a PING to the network.
      request
        .post(`http://${node.address}`, {
          headers: {
            'content-type': 'application/json'
          },
          json: {
            jsonrpc: "2.0",
            method: "net_version",
            params: [],
            // We should ignore any response whose id is smaller than the last
            // response id to linearize the communication between the monitor
            // and the network nodes.
            id: node.lastResponseId + 1
          }
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

  private createPingTimer() : NodeJS.Timer {
    return setInterval(() => {
      this.ping();
    }, Monitor.k_HEARTBEAT_INTERVAL);
  }

  /**
   * Construct a monitor for the given nodes, open an HTTP server on the given
   * port for incoming requests.
   */
  constructor(nodes: IMonitoredNodeConfig[]) {
    this.server = express();
    this.setupRouting();

    this.nodesStatus = [];
    for (let node of nodes) {
      this.nodesStatus.push(this.configToInitialNodeStatus(node));
    }

    this.timer = this.createPingTimer();
    // Ping once immediately on creation to avoid having stale states for the
    // first few seconds.
    this.ping();
  }

  /**
   * Start the embedded HTTP server to process requests on the given port.
   */
  public start(port: number) {
    this.server.listen(port);
  }
};

/**
 * Read the configuration file asynchronously and return the result.
 */
async function parseConfigs(path: string) : Promise<IMonitoredNodeConfig[]> {
  const result = new Promise<IMonitoredNodeConfig[]>((resolve, reject) => {
    var configs : IMonitoredNodeConfig[] = [];

    const readStream = fs.createReadStream(path);
    readStream.on('error', (err) => {
      reject(`Failed to read configuration: ${err}`);
    });

    const lineReader = readline.createInterface({
      input: readStream
    });

    lineReader.on('line', (line) => {
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
};

program
  .usage('<port> <configpath> <logpath>')
  .action(async (port: string, configPath: string, logPath: string) => {
    winston.add(winston.transports.File, {
      filename: logPath
    });
    winston.remove(winston.transports.Console);

    winston.info(`Using configuration at: ${configPath}`);

    const portNum = parseInt(port);

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
