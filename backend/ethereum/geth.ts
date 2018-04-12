import * as rimraf from 'rimraf';

import { ISpawnInput } from '../../lib/utils/shell';

interface IGethFlags {
  // Disable peer discovery (manual addition only).
  nodiscover?: boolean;
  // Default is 25. Set to 0 to disable network.
  maxpeers?: number;
  // Whether to enable RPC. If false, RPC configs below won't be used.
  rpc?: boolean;
  // APIs offered through RPC.
  rpcapi?: string[];
  // Default is 127.0.0.1, accessible from local only.
  rpcaddr?: string;
  // Default is 8545.
  rpcport?: number;
  // List of domains from which to accept cross origin requests.
  rpccorsdomain?: string[];
  // Directory that contains database and keystore.
  datadir?: string;
  // Default is 30303.
  port?: number;
  // Custom node name.
  identity?: string;
  // 1=Frontier (default), 2=Morden (disused), 3=Ropsten, 4=Rinkeby.
  networkid?: number;
}

export class Geth {

  /**
   * Generates shell command to initialize a genesis block.
   * 
   * @param {string} datadir - The data directory.
   * @param {string} genesis - The path to the genesis.json file.
   * @returns {ISpawnInput} The initialization script.
   */
  static initScript(datadir: string, genesis: string) : ISpawnInput {
    return {command: 'geth', options: ['--datadir', datadir, 'init', genesis]};
  }

  static cleanup(datadir: string, callback?: (error: Error) => void) {
    callback ? rimraf(datadir, callback) : rimraf.sync(datadir);
  }

  /**
   * Generates shell command to start a node.
   * 
   * @param {IGethFlags} flags - Geth flags to pass to the start command.
   * @returns {ISpawnInput} The start script.
   */
  static startScript(flags: IGethFlags) : ISpawnInput {
    let options = ['console'];
    
    if (flags.nodiscover) {
      options.push('--nodiscover');
    }

    if (flags.maxpeers) {
      options.push('--maxpeers');
      options.push(flags.maxpeers.toString());
    }

    if (flags.port) {
      options.push('--port');
      options.push(flags.port.toString());
    }

    if (flags.identity) {
      options.push('--identity');
      options.push(flags.identity);
    }

    if (flags.datadir) {
      options.push('--datadir');
      options.push(flags.datadir);
    }

    if (flags.networkid) {
      options.push('--networkid');
      options.push(flags.networkid.toString());
    }
    
    if (flags.rpc) {
      options.push('--rpc');
      if (flags.rpcaddr) {
        options.push('--rpcaddr');
        options.push(flags.rpcaddr);
      }
      if (flags.rpcport) {
        options.push('--rpcport');
        options.push(flags.rpcport.toString());
      }
      if (flags.rpcapi) {
        options.push('--rpcapi');
        options.push(flags.rpcapi.join());
      }
      if (flags.rpccorsdomain) {
        options.push('--rpccorsdomain');
        options.push(flags.rpccorsdomain.join());
      }
    }

    return {command: 'geth', options};
  }
}
