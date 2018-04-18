import * as path from 'path';

import * as fs from 'fs-extra';

import { ETHEREUM_PROJECT_GENESIS } from '../../data';

/**
 * Creates a genesis.json file.
 *
 * @param {string} folder - The folder to put genesis.json in.
 */
export function createGenesis(folder: string) {
  const file = path.join(folder, 'genesis.json');
  if (fs.existsSync(file)) {
    throw new Error('genesis file already exists');
  }
  fs.ensureDirSync(folder);
  fs.copySync(ETHEREUM_PROJECT_GENESIS, file);
}
