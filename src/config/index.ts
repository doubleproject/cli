import * as fs from 'fs';

import * as _ from 'lodash';
import * as YAML from 'yamljs';

import { ETHEREUM_ROOTCFG } from '../data';
import {
  IBaseEnvConfig, ILocalConfig, IProjectConfig, IRemoteConfig,
} from './schema';
import Validator from './validator';

export default class Config {

  /**
   * Initializes a project.
   *
   * This creates a double.yaml file in the current folder. If such a file
   * already exists, an error is thrown.
   */
  public static init(name: string): IProjectConfig {
    if (fs.existsSync('double.yaml')) {
      throw new Error('double.yaml already exists.');
    }

    const config = Config.parseFromFile(ETHEREUM_ROOTCFG);
    fs.writeFileSync('double.yaml', YAML.stringify(config));
    return config;
  }

  /**
   * Gets the current project configuration.
   *
   * @param {boolean} nocascade - If true, only try to read from double.yaml.
   *     If omitted or false, this function will try to read from the default
   *     config file when double.yaml doesn't exist in the current folder.
   * @returns {IProjectConfig} The project configuration.
   */
  public static get(nocascade?: boolean): IProjectConfig {
    if (!fs.existsSync('double.yaml')) {
      if (nocascade) {
        throw new Error('double.yaml not found in current directory');
      }
      return Config.parseFromFile(ETHEREUM_ROOTCFG);
    }

    try {
      return Config.parseFromFile('double.yaml');
    } catch {
      throw new Error('Invalid double.yaml');
    }
  }

  public static parseFromFile(path: string): IProjectConfig {
    return new Validator().validateProjectConfig(YAML.load(path));
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
