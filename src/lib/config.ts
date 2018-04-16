import * as YAML from 'yamljs';
import { Validator } from './utils/validator';
import * as _ from 'lodash';

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
  /**
   * A path to the directory storing all keyfiles for this remote network.
   */
  keydir: string;
}

/**
 * This interface represents the single config file per project.
 */
export interface IBosonProjConfig {
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
  local?: IBosonLocalConfig;

  /**
   * The test network overrides.
   */
  test?: IBosonRemoteConfig;

  /**
   * The main network overrides.
   */
  main?: IBosonRemoteConfig;
}

export class ConfigParser {
  static async parseProjConfigFromFile(path: string) : Promise<string | IBosonProjConfig> {
    try {
      const data = YAML.load(path);
      const validator = new Validator();
      const result = await validator.validateProjConfig(data);
      return result;
    } catch (error) {
      return error.toString();
    }
  }
  
  private static buildCompleteConfig<T>(root: IBosonConfig, other: T) : T {
    // Note: this has some un-wanted interactions with typeof, just in case we
    // run into that problem in the future:
    // https://stackoverflow.com/questions/34201483/deep-clone-in-typescript-preserving-types
    var otherCopy : any = _.cloneDeep(other);
    for (let key in root) {
      if (!(key in otherCopy)) {
        otherCopy[key] =
          _.cloneDeep((<any>root)[key]);
      }
    }

    return <T>otherCopy;
  }

  /**
   * Given a root level config, a local config, build a complete local config.
   * The local config takes preference if they both set the same field.
   */
  static buildCompleteLocalConfig(root: IBosonConfig,
                                  local: IBosonLocalConfig) : IBosonLocalConfig {
    return ConfigParser.buildCompleteConfig<IBosonLocalConfig>(root, local);
  }

  /**
   * Given a root level config, a remote config, build a complete remote config.
   * The remote config takes preference if they both set the same field.
   */
  static buildCompleteRemoteConfig(root: IBosonConfig,
                                   remote: IBosonRemoteConfig) : IBosonRemoteConfig {
    return ConfigParser.buildCompleteConfig<IBosonRemoteConfig>(root, remote);
  }

}

/**
 * Create a default configuration for a project with its name.
 */
export function defaultConfigForProject(name: string) : IBosonProjConfig {
  return {
    project: name,
    chain: 'ethereum',
    local: {
      chain: 'ethereum',
      backend: 'geth',
      datadir: '~/.boson/datadir',
      hosts: ['127.0.0.1:30303']
    }
  };
};
