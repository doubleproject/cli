import * as fs from 'fs';

import { error, executeSync, info } from './utils/shell';
import { Geth } from '../backend/ethereum/geth';

/**
 * Initializes a project.
 * 
 * This creates a boson.yaml file in the current folder that contains configs
 * for the project. If such file already exists, it will be used. Then if a
 * local environment is specified, the network will be initialized.
 */
export default function main() {
  // Set up the configuration file.
  if (fs.existsSync('boson.yaml')) {

  } else {

  }

  // Check if genesis is set up. If not, create it.
  const command = Geth.initScript('./fixtures/ethereum', './fixtures/ethereum/genesis.json');
  const response = executeSync(command);
  if (response.status === 0) {
    logInitSuccess();
  } else {
    logGenesisError();
  }
}

function logInitSuccess() {
  info('setup new network');
}

function logGenesisError() {
  error('Unable to initialize local network.');
}
