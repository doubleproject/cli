/**
 * This file is the entrypoint to the various backends. As a general rule,
 * functions outside this folder should not call specific backends directly,
 * and should rather go through routers in this file.
 */

import { untildify } from '../lib/utils/compat';
import * as ethereum from './ethereum';

/**
 * Creates a genesis.json file.
 *
 * @param {string} chain - Type of the blockchain.
 * @param {string} datadir - The folder to put genesis.json in.
 */
export function createGenesis(chain: string, datadir: string) {
  datadir = untildify(datadir);
  if (chain === 'ethereum') {
    ethereum.createGenesis(datadir);
  } else {
    throw new Error(`Unsupported chain ${chain}`);
  }
}

export function createAccounts(
  chain: string, datadir: string, pw?: string, count?: number,
) {
  datadir = untildify(datadir);
  if (chain === 'ethereum') {
    ethereum.createAccounts(datadir, pw, count);
  } else {
    throw new Error(`Unsupported chain ${chain}`);
  }
}

/**
 * Cleans a data directory.
 *
 * Blocks (transactions) are wiped, but keys and genesis.json file are kept.
 * As such, this is currently only applicable to local environments.
 *
 * @param {string} chain - Type of the blockchain.
 * @param {string} datadir - The root data directory of the environment.
 * @param {string} backend - The backend used.
 */
export function clean(chain: string, datadir: string, backend: string) {
  datadir = untildify(datadir);
  if (chain === 'ethereum') {
    ethereum.clean(datadir, backend);
  } else {
    throw new Error(`Unsupported chain ${chain}`);
  }
}
