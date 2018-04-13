export interface IBosonConfig {
  /**
   * Name of the chain. Default is ethereum.
   */
  chain: string;
  /**
   * Backend to use. Default is geth.
   */
  backend?: string;
  /**
   *  An array of account keystore file paths, this will be used to import
   * accounts on initialization.
   * /
  accounts?: string[];
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
export interface IBosonLocalConfig extends IBosonConfig {
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
}

/**
 * For remote networks, we cannot control how they're started. But having a
 * separate type for live configurations could make code clearer.
 * 
 * TODO[hengchu]: I'm not super sure what the parameters should be yet.
 */
export interface IBosonRemoteConfig extends IBosonConfig {
  // EMPTY
}
