import * as _ from 'lodash';
import * as YAML from 'yamljs';

import { Validator } from './utils/validator';

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

export class ConfigParser {

  static async parseProjConfigFromFile(path: string): Promise<IProjectConfig> {
    return await new Validator().validateProjConfig(YAML.load(path));
  }

  private static buildCompleteConfig<T>(root: IBaseEnvConfig, other: T): T {
    // Note: this has some un-wanted interactions with typeof, just in case we
    // run into that problem in the future:
    // https://stackoverflow.com/questions/34201483/deep-clone-in-typescript-preserving-types
    const otherCopy: T = _.cloneDeep(other);
    for (const key in root) {
      if (!(key in otherCopy)) {
        otherCopy[key] = _.cloneDeep(root[key]);
      }
    }

    return otherCopy;
  }

  /**
   * Given a root level config, a local config, build a complete local config.
   * The local config takes preference if they both set the same field.
   */
  private static buildCompleteLocalConfig(
    root: IBaseEnvConfig, local: ILocalConfig,
  ): ILocalConfig {
    return ConfigParser.buildCompleteConfig<ILocalConfig>(root, local);
  }

  /**
   * Given a root level config, a remote config, build a complete remote config.
   * The remote config takes preference if they both set the same field.
   */
  private static buildCompleteRemoteConfig(
    root: IBaseEnvConfig, remote: IRemoteConfig,
  ): IRemoteConfig {
    return ConfigParser.buildCompleteConfig<IRemoteConfig>(root, remote);
  }
}

/**
 * Create a default configuration for a project with its name.
 */
export function defaultConfigForProject(name: string): IProjectConfig {
  return {
    project: name,
    chain: 'ethereum',
    local: {
      chain: 'ethereum',
      backend: 'geth',
      datadir: '~/.boson/datadir',
      hosts: ['127.0.0.1:30303'],
    },
  };
}
