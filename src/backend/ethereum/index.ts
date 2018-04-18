import * as fs from 'fs';

/**
 * Creates a genesis.json file.
 *
 * @param {string} path - The path to put genesis.json under.
 */
export function createGenesis(path: string) {
  if (fs.existsSync(path)) {
    throw new Error('genesis file already exists');
  }
  return;
}
