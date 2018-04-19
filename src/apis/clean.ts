import Config from '../config';

export function cli(env: string | undefined) {
  env ? cleanEnv(env) : cleanProject();
}

/**
 * Cleans the current project.
 */
function cleanProject() {
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
    return;
  }
}
