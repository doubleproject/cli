export interface IBaseEnvConfig {
  /**
   * Name of the chain. Default is ethereum.
   */
  chain: string;
  /**
   * Backend to use. Default is geth.
   */
  backend?: string;
  /**
   * The directory to store accounts in.
   */
  datadir: string;
  /**
   * A non-empty array of host IP:port addresses, in that format.
   * @minItems 1
   */
  hosts: string[];
}

/**
 * For local dev networks, we can control what their parameters are. These can
 * be used to fill the parameters to IGethFlags, for example, when we start a
 * local network. But they should be generic enough to support all the backends.
 *
 * TODO[hengchu]: I'm not super sure what the parameters should be yet, but
 * here's a couple.
 */
export interface ILocalConfig extends IBaseEnvConfig {
  /**
   * Custom node name.
   */
  nodeName?: string;
  /**
   * Network id.
   */
  networkid?: number;
  /**
   * Gas price multiplier (in Wei).
   */
  gasPrice?: number;
  /**
   * Location of the genesis.json file, if there should be one.
   */
  genesis?: string;
}

/**
 * For remote networks, we cannot control how they're started. But having a
 * separate type for live configurations could make code clearer.
 *
 * TODO[hengchu]: I'm not super sure what the parameters should be yet.
 */
export interface IRemoteConfig extends IBaseEnvConfig {
  /**
   * A path to the directory storing all keyfiles for this remote network.
   */
  keydir: string;
}

interface IEnvs {
  /**
   * The local network overrides.
   */
  local?: ILocalConfig;

  /**
   * The test network overrides.
   */
  test?: IRemoteConfig;

  /**
   * The main network overrides.
   */
  main?: IRemoteConfig;
}

/**
 * This interface represents the single config file per project.
 */
export interface IProjectConfig {
  /**
   * The name of the project.
   */
  project: string;

  /**
   * Name of the chain. Default is ethereum.
   */
  chain: string;

  env: IEnvs;
}
