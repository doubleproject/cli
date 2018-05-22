import * as path from 'path';

import * as fs from 'fs-extra';
import * as keythereum from 'keythereum';

import { IEnvConfig } from '../../config/schema';
import { ETHEREUM_PROJECT_GENESIS } from '../../data';
import { executeSync } from '../../lib/utils/shell';
import { execute } from '../../lib/utils/shell';
import { addToMonitor } from '../../monitor';

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
    accounts = fs.readJsonSync(manifest);
  }

  const genesis = fs.readJsonSync(ETHEREUM_PROJECT_GENESIS);
  for (const key of Object.keys(accounts).sort()) {
    genesis.alloc[accounts[key]] = {balance: '10000000000000000000'};
  }

  fs.ensureDirSync(datadir);
  fs.writeJsonSync(file, genesis, {spaces: 2});
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
    accounts = fs.readJsonSync(manifest);
  }

  const existing = Object.keys(accounts).length;
  count = count || 5;

  for (let i = 0; i < count; i++) {
    const dk = keythereum.create();
    const key = keythereum.dump(pw || 'double', dk.privateKey, dk.salt, dk.iv);
    keythereum.exportToFile(key, keystore);
    accounts[`a${existing + i + 1}`] = key.address;
  }

  fs.writeJsonSync(manifest, accounts, {spaces: 2});
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
 * @param {string} proj - The name of the project.
 * @param {string} env - The name of the environment.
 * @param {IEnvConfig} config - The environment configuration.
 */
export function start(
  datadir: string, proj: string, env: string, config: IEnvConfig,
) {
  if (config.backend === 'geth') {
    const ip = config.host;
    const port = config.port;
    const rpcPort = config.rpcPort ? config.rpcPort! : 8545;

    const script = Geth.startScript({
      datadir,
      nodiscover: true,
      rpc: true,
      networkid: config.networkID,
      port,
      rpcport: rpcPort,
    });

    const process = execute(script, path.join(datadir, 'geth.log'));

    addToMonitor([{
      address: `${ip}:${rpcPort}`,
      project: proj,
      environment: env,
      processId: process.pid,
      reviveCmd: script.command,
      reviveArgs: script.options.join(' '),
    }]);

  } else {
    throw new Error(`Unsupported Ethereum backend ${config.backend}`);
  }
}
