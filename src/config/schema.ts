export interface INodeConfig {
  /** Host IP address */
  host: string;

  /** Protocol port */
  port: number;

  /** JSON-RPC server port */
  rpcPort?: number;
}

type StringOrINodeConfig = string | INodeConfig;

export interface IEnvConfig {
  /** Name of the chain. Default is ethereum. */
  chain?: string;

  /** Whether this is a local environment. */
  local?: boolean;

  /** Whether this is a production environment. */
  production?: boolean;

  /**
   * Data directory relative to the root of the project.
   *
   * For local nodes, this directory will hold everything for the network.
   * For remote nodes, this directory will hold key files for accounts.
   */
  datadir: string;

  /**
   * A non-empty array of host IP:port addresses, in that format.
   *
   * @minItems 1
   */
  hosts: StringOrINodeConfig[];

  /** Backend to use for local nodes. Default is geth. */
  backend?: string;

  /** Custom node name, for local nodes. */
  nodeName?: string;

  /** Network ID. */
  networkID?: number;

  /** Gas price multiplier (in Wei). */
  gasPrice?: number;
}

interface IEnvs {

  /**
   * A dictionary of all environments.
   *
   * A project can have multiple local or remote environments. However, they
   * must have different names and have different datadirs.
   */
  [Key: string]: IEnvConfig;
}

export interface IProjectConfig {

  /** Name of the project. */
  project: string;

  /**
   * Name of the chain. Default is ethereum.
   *
   * For all environments that don't specify a chain, this will be used.
   */
  chain?: string;

  /**
   * Local backend to use. For ETH, the default is geth.
   *
   * For all local networks that don't specify a backend, this will be used.
   */
  backend?: string;

  /** Environments. */
  envs: IEnvs;
}
