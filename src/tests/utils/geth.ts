import * as http from 'http';

import * as bodyParser from 'body-parser';
import * as express from 'express';

export const EXPECTED_PROTOCOL_VERSION = '0x57';
export const EXPECTED_BLOCK_NUMBER = '0x99';
export const EXPECTED_BALANCES: {[index: string]: string} = {
  '0xabc': '0xabcd',
  '0xcba': '0xcbad',
};

export class MockGeth {
  /**
   * The http server acting as mock JSON-RPC server.
   */
  private app: express.Application;

  /**
   * The underlying node http server object.
   */
  private server?: http.Server;

  /**
   * The mock network id used to respond to net_version requests.
   */
  private networkId: string;

  constructor(networkId: string) {
    this.app = express();
    this.setupRouting();
    this.server = undefined;
    this.networkId = networkId;
  }

  /**
   * Start the mock server.
   */
  public async start(port: number): Promise<void> {
    return new Promise<void>(resolve => {
      this.server = http.createServer(this.app);
      this.server.listen(port, () => resolve());
    });
  }

  /**
   * Stop the mock server.
   */
  public async stop(): Promise<void> {
    return new Promise<void>(resolve => {
      if (typeof(this.server) !== 'undefined') {
        this.server.close(() => resolve());
        this.server = undefined;
      } else {
        resolve();
      }
    });
  }

  private setupRouting() {
    this.app.use(bodyParser.json());

    this.app.post('/', (req, res) => {
      switch (req.body.method) {
        case 'net_version': {
          res.send({result: this.networkId, id: req.body.id});
          break;
        }
        case 'eth_accounts': {
          res.send({result: Object.keys(EXPECTED_BALANCES), id: req.body.id});
          break;
        }
        case 'eth_getBalance': {
          let balance = '0x0';
          const account: string = req.body.params[0];
          if (EXPECTED_BALANCES.hasOwnProperty(account)) {
            balance = EXPECTED_BALANCES[account];
          }
          res.send({result: balance, id: req.body.id});
          break;
        }
        case 'eth_blockNumber': {
          res.send({result: EXPECTED_BLOCK_NUMBER, id: req.body.id});
          break;
        }
        case 'eth_protocolVersion': {
          res.send({result: EXPECTED_PROTOCOL_VERSION, id: req.body.id});
          break;
        }
        default: {
          res.status(400).send('Unknown RPC request');
        }
      }
    });
  }
}
