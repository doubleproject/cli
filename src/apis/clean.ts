import * as inquirer from 'inquirer';

import * as ethereum from '../backend/ethereum';
import Config from '../config';
import { info } from '../lib/utils/shell';

/**
 * CLI entrypoint for cleaning a project or environment.
 *
 * When cleaning the entire project, the CLI will seek additional user
 * confirmation. It is an error to clean an invalid environment.
 *
 * @param {string} env - The environment to clean. If omitted, the entire
 *     project is cleaned.
 */
export function cli(env?: string) {
  env ? cleanEnv(env) : cleanProjectWithConfirmation();
}

/**
 * Cleans all environments of the current project.
 *
 * This function asks for user confirmation before proceeding. If there is no
 * current project, the default project will be cleaned.
 */
function cleanProjectWithConfirmation() {
  const cfg = Config.get();
  info(`Cleaning ${cfg.project} project...`);
  info('This will remove all blocks from all local environments. ' +
    'To clean a specific environment, use `double clean [env]`.\n');
  const questions = [{
    type: 'confirm',
    name: 'confirm',
    message: 'Do you want to clean the entire project?',
  }];
  inquirer.prompt(questions).then((answers: any) => {
    if (answers.confirm) {
      cleanProject();
    }
  });
}

function cleanProject() {
  for (const key of Object.keys(Config.get().envs)) {
    cleanEnv(key);
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
    ethereum.clean(cfg.datadir, cfg.backend!);
    info(`Environment cleaned: ${env}`);
  } else {
    throw new Error(`Unsupported chain: ${cfg.chain}`);
  }
}
