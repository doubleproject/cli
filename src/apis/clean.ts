import { clean as cleanETH } from '../backend/ethereum';
import Config from '../config';
import { error } from '../lib/utils/shell';

export function cli(env?: string) {
  try {
    env ? cleanEnv(env) : cleanProject(true);
  } catch (e) {
    error(e.message);
  }
}

/**
 * Cleans all environments of the current project.
 *
 * If there is no current project, the default project will be cleaned.
 *
 * @param {boolean} confirm - If true, ask use to confirm cleaning.
 */
function cleanProject(confirm?: boolean) {
  console.log('project');
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
  const cfg = Config.getForEnv(env, true);
  if (cfg.chain === 'ethereum') {
    cleanETH(cfg.datadir, cfg.backend!);
  }

  throw new Error(`Invalid environment ${env}`);
}
