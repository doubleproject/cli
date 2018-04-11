interface IGethFlags {
  nodiscover?: boolean;
  maxpeers?: number;
  rpc?: boolean;
  rpcapi?: string[];
  rpcaddr?: string;
  rpcport?: number;
  rpccorsdomain?: string;
  datadir: string;
  port?: number;
  nat: string;
  identity?: string;
}

export class Geth {
  static startScriptWithFlags(flags: IGethFlags) : string {
    let commands = ['geth'];
    
    if (flags.nodiscover) {
      commands.push('--nodiscover');
    }

    if (flags.port) {
      commands.push('--port');
      commands.push(flags.port.toString());
    }

    if (flags.identity) {
      commands.push('--identity');
      commands.push(flags.identity);
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
        commands.push(flags.rpccorsdomain);
      }
    }

    return commands.join(' ');
  }
}
