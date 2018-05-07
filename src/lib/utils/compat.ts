import * as os from 'os';

const home = os.homedir();

/**
 * Expands ~ to home directory for both Windows and Unix.
 *
 * @param {string} path - The path to expand.
 */
export function untildify(path: string) {
  return home ? path.replace(/^~($|\/|\\)/, `${home}$1`) : path;
}
