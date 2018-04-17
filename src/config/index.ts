import * as _ from 'lodash';
import * as YAML from 'yamljs';

import {
  IBaseEnvConfig, ILocalConfig, IProjectConfig, IRemoteConfig,
} from './schema';
import Validator from './validator';

export default class Config {

  public static async parseFromFile(path: string): Promise<IProjectConfig> {
    return await new Validator().validateProjectConfig(YAML.load(path));
  }

  /**
   * Given a root level config, a local config, build a complete local config.
   * The local config takes preference if they both set the same field.
   */
  public static buildCompleteLocalConfig(
    root: IBaseEnvConfig, local: ILocalConfig,
  ): ILocalConfig {
    return Config.buildCompleteConfig<ILocalConfig>(root, local);
  }

  /**
   * Given a root level config, a remote config, build a complete remote config.
   * The remote config takes preference if they both set the same field.
   */
  public static buildCompleteRemoteConfig(
    root: IBaseEnvConfig, remote: IRemoteConfig,
  ): IRemoteConfig {
    return Config.buildCompleteConfig<IRemoteConfig>(root, remote);
  }

  private static buildCompleteConfig<T>(root: IBaseEnvConfig, other: T): T {
    // Note: this has some un-wanted interactions with typeof, just in case we
    // run into that problem in the future:
    // https://stackoverflow.com/questions/34201483/deep-clone-in-typescript-preserving-types
    const otherCopy: any = _.cloneDeep(other);
    for (const key in root) {
      if (!(key in otherCopy)) {
        otherCopy[key] = _.cloneDeep((root as any)[key]);
      }
    }

    return otherCopy as T;
  }
}

/**
 * Create a default configuration for a project with its name.
 */
export function defaultConfigForProject(name: string): IProjectConfig {
  return {
    project: name,
    chain: 'ethereum',
    env: {
      local: {
        chain: 'ethereum',
        backend: 'geth',
        datadir: '~/.double/datadir',
        hosts: ['127.0.0.1:30303'],
      },
    },
  };
}
