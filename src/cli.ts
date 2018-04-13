#!/usr/bin/env node

import * as program from 'commander';

import Locator from './lib/utils/locator';
import { executeSync, info } from './lib/utils/shell';

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
    info('Creating genesis block for chain');
    const command = Geth.initScript('./fixtures/ethereum', './fixtures/ethereum/genesis.json');
    const response = executeSync(command);
    if (response.status === 0) {
      console.log('setup new network!');
    }
  });

program
  .command('reset')
  .description('Reset a blockchain completely, removing all its data')
  .action(() => {
    Geth.cleanup('./fixtures/ethereum/geth');
    console.log('Cleaned up');
  });

program
  .command('start')
  .description('Start a new node')
  .action(() => {
    const command = Geth.startScript({
      nodiscover: true,
      datadir: './fixtures/ethereum/geth',
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
