import * as inquirer from 'inquirer';

import * as ethereum from '../backend/ethereum';
import Config from '../config';
import { IEnvConfig, IProjectConfig } from '../config/schema';

export function cli(env?: string) {
  const cfg = Config.get();
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

  startSingle(env, envcfg);
}

export function startMulti(cfg: IProjectConfig, envs: string[]) {
  const questions = [{
    type: 'list',
    name: 'env',
    message: 'Select the local environment to start:',
    choices: envs,
  }];
  inquirer.prompt(questions).then((answers: any) => {
    startSingle(answers.env, cfg.envs[answers.env]);
  });
}

/**
 * Starts a single environment.
 *
 * @param {string} env - The name of the environment.
 * @param {IEnvConfig} cfg - The config of the environment.
 */
export function startSingle(env: string, cfg: IEnvConfig) {
  if (cfg.chain === 'ethereum') {
    ethereum.start(cfg);
  } else {
    throw new Error(`Invalid chain ${cfg.chain} for ${env} environment`);
  }
}
