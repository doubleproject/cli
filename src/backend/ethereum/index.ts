import * as path from 'path';

import * as fs from 'fs-extra';
import * as keythereum from 'keythereum';

import { IEnvConfig } from '../../config/schema';
import { ETHEREUM_PROJECT_GENESIS } from '../../data';
import { executeSync } from '../../lib/utils/shell';
import { execute } from '../../lib/utils/shell';

import Geth from './geth';

/**
 * Creates a genesis.json file.
 *
 * If there is an account.json file, accounts in it will each be granted 1 ETH
 * in the genesis block.
 *
 * @param {string} datadir - The folder to put genesis.json in.
 */
export function createGenesis(datadir: string) {
  const file = path.join(datadir, 'genesis.json');
  if (fs.existsSync(file)) {
    throw new Error('genesis file already exists');
  }

  let accounts: {[key: string]: string} = {};
  const manifest = path.join(datadir, 'accounts.json');
  if (fs.existsSync(manifest)) {
    accounts = JSON.parse(fs.readFileSync(manifest).toString());
  }

  const genesis = JSON.parse(
    fs.readFileSync(ETHEREUM_PROJECT_GENESIS).toString(),
  );
  for (const key of Object.keys(accounts).sort()) {
    genesis.alloc[accounts[key]] = {balance: '10000000000000000000'};
  }

  fs.ensureDirSync(datadir);
  fs.writeFileSync(file, JSON.stringify(genesis), 'utf8');
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
 * @param {number} count - The number of accounts to generate. Default is 5.
 */
export function createAccounts(datadir: string, pw?: string, count?: number) {
  const manifest = path.join(datadir, 'accounts.json');
  const keystore = path.join(datadir, 'keystore');
  fs.ensureDirSync(keystore);

  let accounts: { [name: string]: string } = {};
  if (fs.existsSync(manifest)) {
    accounts = JSON.parse(fs.readFileSync(manifest).toString());
  }

  const existing = Object.keys(accounts).length;
  count = count || 5;

  for (let i = 0; i < count; i++) {
    const dk = keythereum.create();
    const key = keythereum.dump(pw || 'double', dk.privateKey, dk.salt, dk.iv);
    keythereum.exportToFile(key, keystore);
    accounts[`a${existing + i + 1}`] = key.address;
  }

  fs.writeFileSync(manifest, JSON.stringify(accounts), 'utf8');
}

/**
 * Initializes a local node.
 *
 * @param {string} datadir - The data directory.
 * @param {string} backend - Backend to use.
 */
export function init(datadir: string, backend: string) {
  if (backend === 'geth') {
    const command = Geth.initScript(datadir);
    const result = executeSync(command);
    if (result.status !== 0) {
      throw new Error(`Unable to start Geth node\n${result.error}`);
    }
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
  if (backend === 'geth') {
    Geth.clean(datadir);
  } else {
    throw new Error(`Unsupported Ethereum backend ${backend}`);
  }
}

/**
 * Starts a local backend.
 *
 * @param {string} datadir - The data directory.
 * @param {IEnvConfig} config - The environment configuration.
 */
export function start(datadir: string, config: IEnvConfig) {
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
