import * as fs from 'fs';

import * as _ from 'lodash';
import * as YAML from 'yamljs';

import { ETHEREUM_BASE_CFG, ETHEREUM_DEFAULT_CFG } from '../data';
import { IEnvConfig, IProjectConfig } from './schema';
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

    const config = Config.parseFromFile(ETHEREUM_BASE_CFG);
    config.project = name;
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
      return Config.parseFromFile(ETHEREUM_DEFAULT_CFG);
    }

    try {
      return Config.parseFromFile('double.yaml');
    } catch {
      throw new Error('Invalid double.yaml');
    }
  }

  /**
   * Gets the current project configuration for a particular environment.
   *
   * @param {string} env - The environment to get configuration from.
   * @param {boolean} nocascade - If true, only try to read from double.yaml.
   *     If omitted or false, this function will try to read from the default
   *     config file when double.yaml doesn't exist in the current folder.
   * @returns {IEnvConfig} The project configuration for an environment.
   */
  public static getForEnv(env: string, nocascade?: boolean): IEnvConfig | null {
    const cfg = Config.get(nocascade);
    if (!cfg.envs[env]) {
      return null;
    }

    const envcfg = _.cloneDeep(cfg.envs[env]);
    if (!envcfg.chain && cfg.chain) {
      envcfg.chain = cfg.chain;
    }
    if (!envcfg.backend && cfg.backend) {
      envcfg.backend = cfg.backend;
    }
    return envcfg;
  }

  /**
   * Loads a project configuration from a file.
   *
   * @param {string} path - The path at which the file is located.
   * @returns {IProjectConfig} - The project configuration.
   */
  public static parseFromFile(path: string): IProjectConfig {
    return new Validator().validateProjectConfig(YAML.load(path));
  }
}
