/**
 * This file is the entrypoint to the various backends. As a general rule,
 * functions outside this folder should not call specific backends directly,
 * and should rather go through routers in this file.
 */

import { IEnvConfig } from '../config/schema';
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

/**
 * Creates accounts.
 *
 * This creates accounts offline by generating private key files, and creates
 * or updates the accounts.json file.
 *
 * @param {string} chain - Type of the blockchain.
 * @param {string} datadir - The data directory. Key files will be kept in the
 *     keystore subfolder, and accounts.json will be placed in the root level.
 * @param {string} pw - The password to lock the key files with. If not
 *     provided, default to double.
 * @param {number} count - The number of accounts to generate. Default to 5.
 */
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
 * Initializes a local node.
 *
 * @param {string} chain - Type of the blockchain.
 * @param {string} datadir - The data directory.
 * @param {string} backend - Backend to use.
 */
export function init(chain: string, datadir: string, backend: string) {
  datadir = untildify(datadir);
  if (chain === 'ethereum') {
    ethereum.init(datadir, backend);
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

/**
 * Starts a local node.
 *
 * @param {string} chain - Type of the blockchain.
 * @param {string} datadir - The data directory.
 * @param {string} proj - The name of the project.
 * @param {string} env - The name of the environment.
 * @param {IEnvConfig} config - The environment configuration.
 */
export function start(chain: string,
                      datadir: string,
                      proj: string,
                      env: string,
                      config: IEnvConfig) {
  datadir = untildify(datadir);
  if (chain === 'ethereum') {
    ethereum.start(datadir, proj, env, config);
  } else {
    throw new Error(`Unsupported chain ${chain}`);
  }
}
