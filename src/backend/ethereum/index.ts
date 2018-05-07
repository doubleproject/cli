import * as path from 'path';

import * as fs from 'fs-extra';
import * as keythereum from 'keythereum';

import { IEnvConfig } from '../../config/schema';
import { ETHEREUM_PROJECT_GENESIS } from '../../data';
import { untildify } from '../../lib/utils/compat';
import { executeSync } from '../../lib/utils/shell';
import { execute } from '../../lib/utils/shell';

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

export function createAccounts(
  datadir: string, backend: string, count?: number,
) {
  const keystore = path.join(untildify(datadir), 'keystore');

  // let accounts = {};
  // const manifest = path.join(datadir, 'accounts.json');
  // if (fs.existsSync(manifest)) {
  //   accounts = {};
  // }

  count = count || 10;
  for (let i = 0; i < count; i++) {
    const dk = keythereum.create();
    const key = keythereum.dump('double', dk.privateKey, dk.salt, dk.iv);
    keythereum.exportToFile(key, keystore);
    // accounts[i] = key.address;
  }
}

export function init(datadir: string, backend: string): boolean {
  datadir = untildify(datadir);
  if (backend === 'geth') {
    const command = Geth.initScript(datadir);
    return executeSync(command).status === 0;
  } else {
    throw new Error(`Unsupported Ethereum backend ${backend}`);
  }
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
  datadir = untildify(datadir);
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
  const datadir = untildify(config.datadir);
  if (config.backend === 'geth') {
    const script = Geth.startScript({
      datadir,
      nodiscover: true,
      rpc: true,
      networkid: config.networkID,
    });
    execute(script, path.join(datadir, 'geth.log'));
  } else {
    throw new Error(`Unsupported Ethereum backend ${config.backend}`);
  }
}
