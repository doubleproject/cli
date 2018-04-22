import * as path from 'path';

import * as fs from 'fs-extra';

import { IEnvConfig } from '../../config/schema';
import { ETHEREUM_DATADIR, ETHEREUM_PROJECT_GENESIS } from '../../data';
import Geth from './geth';

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

/**
 * Cleans a data directory.
 *
 * Blocks (transactions) are wiped, but keys and genesis.json file are kept.
 * As such, this is currently only applicable to local environments.
 *
 * @param {string} datadir - The root data directory of the environment.
 * @param {string} backend - The backend used.
 */
export function clean(datadir: string, backend: string) {
  if (backend === 'geth') {
    Geth.clean(datadir);
  } else {
    throw new Error(`Unsupported Ethereum backend ${backend}`);
  }
}

/**
 * Starts a local backend.
 *
 * @param {IEnvConfig} config - The environment configuration.
 */
export function start(config: IEnvConfig) {
  if (config.backend === 'geth') {
    Geth.startScript({
      datadir: ETHEREUM_DATADIR,
      identity: 'boson',
      nodiscover: true,
      rpc: true,
    });
  }
}

/**
 * Stops a local backend.
 */
export function stop() {
  console.log('stop');
}
