import * as rimraf from 'rimraf';

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
}

export class Geth {

  /**
   * Generates shell command to initialize a genesis block.
   * 
   * @param {string} datadir - The data directory.
   * @param {string} genesis - The path to the genesis.json file.
   * @returns {string} The initialization script.
   */
  static initScript(datadir: string, genesis: string) : string {
    return `geth --datadir ${datadir} init ${genesis}`;
  }

  static cleanup(datadir: string, callback?: (error: Error) => void) {
    callback ? rimraf(datadir, callback) : rimraf.sync(datadir);
  }

  /**
   * Generates shell command to start a node.
   * 
   * @param {IGethFlags} flags - Geth flags to pass to the start command.
   * @returns {string} The start script.
   */
  static startScriptWithFlags(flags: IGethFlags) : string {
    let commands = ['geth'];
    
    if (flags.nodiscover) {
      commands.push('--nodiscover');
    }

    if (flags.maxpeers) {
      commands.push('--maxpeers');
      commands.push(flags.maxpeers.toString());
    }

    if (flags.port) {
      commands.push('--port');
      commands.push(flags.port.toString());
    }

    if (flags.identity) {
      commands.push('--identity');
      commands.push(flags.identity);
    }

    if (flags.datadir) {
      commands.push('--datadir');
      commands.push(flags.datadir);
    }
    
    if (flags.rpc) {
      commands.push('--rpc');
      if (flags.rpcaddr) {
        commands.push('--rpcaddr');
        commands.push(flags.rpcaddr);
      }
      if (flags.rpcport) {
        commands.push('--rpcport');
        commands.push(flags.rpcport.toString());
      }
      if (flags.rpcapi) {
        commands.push('--rpcapi');
        commands.push(flags.rpcapi.join());
      }
      if (flags.rpccorsdomain) {
        commands.push('--rpccorsdomain');
        commands.push(flags.rpccorsdomain.join());
      }
    }

    return commands.join(' ');
  }
}
