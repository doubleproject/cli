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

/**
 * Creates accounts.
 *
 * This creates accounts offline by generating private key files, and creates
 * or updates the accounts.json file.
 *
 * @param {string} datadir - The data directory. Key files will be kept in the
 *     keystore subfolder, and accounts.json will be placed in the root level.
 * @param {string} pw - The password to lock the key files with. If not
 *     provided, default to double.
 * @param {number} count - The number of accounts to generate. Default to 10.
 */
export function createAccounts(datadir: string, pw?: string, count?: number) {
  datadir = untildify(datadir);
  const manifest = path.join(datadir, 'accounts.json');
  const keystore = path.join(datadir, 'keystore');

  let accounts: { [name: string]: string } = {};
  if (fs.existsSync(manifest)) {
    accounts = JSON.parse(fs.readFileSync(manifest).toString());
  }

  const existing = Object.keys(accounts).length;
  count = count || 10;

  for (let i = 0; i < count; i++) {
    const dk = keythereum.create();
    const key = keythereum.dump(pw || 'double', dk.privateKey, dk.salt, dk.iv);
    keythereum.exportToFile(key, keystore);
    accounts[`a${existing + i}`] = key.address;
  }

  fs.writeFileSync(manifest, JSON.stringify(accounts), 'utf8');
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
