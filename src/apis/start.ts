import * as inquirer from 'inquirer';

import * as backend from '../backend';
import Config from '../config';
import { IEnvConfig, IProjectConfig } from '../config/schema';
import { info } from '../lib/utils/logging';

export function cli(env?: string) {
  startForConfig(Config.get(), env);
}

/**
 * Starts a local environment.
 *
 * If env is not provided, displays a list of envs for the user to choose from
 * if there are multiple stopped local envs, and if there's only one such env,
 * it will be started.
 *
 * @param {IProjectConfig} cfg - The project configuration.
 * @param {string} env - The environment to start.
 */
export function startForConfig(cfg: IProjectConfig, env?: string) {
  let envcfg: IEnvConfig;

  if (env) {
    if (!cfg.envs[env]) {
      throw new Error(`Invalid environment to start: ${env}`);
    }
    if (!cfg.envs[env].local) {
      throw new Error('Only local environments can be started');
    }
    envcfg = cfg.envs[env];
  } else {
    const envs = [];
    for (const key of Object.keys(cfg.envs)) {
      if (cfg.envs[key].local) {
        envs.push(key);
      }
    }
    if (envs.length === 0) {
      throw new Error('Project has no local environment');
    }
    if (envs.length > 1) {
      startMulti(cfg, envs);
      return;
    }

    envcfg = cfg.envs[envs[0]];
    env = envs[0];
  }

  startSingle(cfg.project, env, envcfg);
}

export function startMulti(cfg: IProjectConfig, envs: string[]) {
  const questions = [{
    type: 'list',
    name: 'env',
    message: 'Select the local environment to start:',
    choices: envs,
  }];
  inquirer.prompt(questions).then((answers: any) => {
    startSingle(cfg.project, answers.env, cfg.envs[answers.env]);
  });
}

/**
 * Starts a single environment.
 *
 * @param {string} proj - The name of the project.
 * @param {string} env - The name of the environment.
 * @param {IEnvConfig} cfg - The config of the environment.
 */
export function startSingle(proj: string, env: string, cfg: IEnvConfig) {
  info(`Starting ${env} environment`);
  backend.start(cfg.chain!, cfg.datadir, proj, env, cfg);
}
