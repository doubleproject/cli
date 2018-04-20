import * as inquirer from 'inquirer';

import { clean as cleanETH } from '../backend/ethereum';
import Config from '../config';
import { info } from '../lib/utils/shell';

export function cli(env?: string) {
  env ? cleanEnv(env) : cleanProject(true);
}

/**
 * Cleans all environments of the current project.
 *
 * If there is no current project, the default project will be cleaned.
 *
 * @param {boolean} confirm - If true, ask use to confirm cleaning.
 */
function cleanProject(confirm?: boolean) {
  const cfg = Config.get();

  if (confirm) {
    info(`Cleaning ${cfg.project} project...`);
    info('This will remove all blocks from all local environments. ' +
      'To clean a specific environment, use `double clean [env]`.\n');
    const questions = [{
      type: 'confirm',
      name: 'confirm',
      message: 'Do you want to clean the entire project?',
    }];
    inquirer.prompt(questions).then((answers: any) => {
      if (!answers.confirm) {
        return;
      }
    });
  }

  for (const name in cfg.envs) {
    if (cfg.envs.hasOwnProperty(name)) {
      cleanEnv(name);
    }
  }
}

/**
 * Cleans a particular environment of the current project.
 *
 * If there is no current project (i.e. using the default project) or if the
 * environment is missing, an error will be thrown.
 *
 * @param {string} env - The environment to clean.
 */
function cleanEnv(env: string) {
  const cfg = Config.getForEnv(env);
  if (!cfg.local) {
    return;
  }

  if (cfg.chain === 'ethereum') {
    cleanETH(cfg.datadir, cfg.backend!);
    info(`Environment cleaned: ${env}`);
  } else {
    throw new Error(`Environment not found: ${env}`);
  }
}
