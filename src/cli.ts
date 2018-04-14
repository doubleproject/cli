#!/usr/bin/env node

import * as program from 'commander';

import { ETHEREUM_DATADIR, ETHEREUM_GENESIS } from './data';
import Locator from './lib/utils/locator';
import { executeSync, info } from './lib/utils/shell';
import { initializeRootConfig } from './lib/initialize';

import { Geth } from './backend/ethereum/geth';

program.version('0.1.0');

program
  .command('list')
  .description('List available networks')
  .action(() => {
    executeSync({command: 'geth', 'options': ['account', 'list']});
  });

program
  .command('init')
  .description('Initialize a blockchain by creating the genesis block')
  .action(() => {
    // Create a root.yaml file if it doesn't exist.
    initializeRootConfig();
    
    info('Creating genesis block for chain');
    const command = Geth.initScript(ETHEREUM_DATADIR, ETHEREUM_GENESIS);
    const response = executeSync(command);
    if (response.status === 0) {
      console.log('setup new network!');
    }
  });

program
  .command('reset')
  .description('Reset a blockchain completely, removing all its data')
  .action(() => {
    Geth.cleanup(ETHEREUM_DATADIR);
    console.log('Cleaned up');
  });

program
  .command('start')
  .description('Start a new node')
  .action(() => {
    const command = Geth.startScript({
      nodiscover: true,
      datadir: ETHEREUM_DATADIR,
      identity: 'boson',
      rpc: true,
    });
    executeSync(command);
  });

// This is just a temporary convenient entrypoint to test the locator out
program
  .command('search <name>')
  .description('Search for the executable')
  .action((name) => {
    console.log(Locator.search(name));
  });

program
  .command('search-under <name> [dirs...]')
  .description('Search for the executable')
  .action((name, dirs) => {
    console.log(Locator.searchUnder(name, dirs));
  });


program.parse(process.argv);

if (program.args.length === 0) {
  program.help();
};
