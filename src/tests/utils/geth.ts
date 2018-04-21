import * as http from 'http';

import * as bodyParser from 'body-parser';
import * as express from 'express';

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
   * Start the mock server
   */
  public start(port: number) {
    this.server = http.createServer(this.app);
    this.server.listen(port);
  }

  /**
   * Stop the mock server.
   */
  public stop() {
    if (typeof(this.server) !== 'undefined') {
      this.server.close();
      this.server = undefined;
    }
  }

  private setupRouting() {
    this.app.use(bodyParser.json());

    this.app.post('/', (req, res) => {
      switch (req.body.method) {
        case 'net_version': {
          res.send({result: this.networkId, id: req.body.id});
          break;
        }
        default: {
          res.status(400).send('Unknown RPC request');
        }
      }
    });
  }
}
