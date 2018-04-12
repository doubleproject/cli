#!/usr/bin/env node

import * as program from 'commander';

import { Locator } from './lib/utils/locator';
import { executeSync } from './lib/utils/shell';

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
  .description('Set up a new network')
  .action(() => {
    const command = Geth.initScript('./fixtures/ethereum', './fixtures/ethereum/genesis.json');
    const response = executeSync(command);
    if (response.status === 0) {
      console.log('setup new network!');
    }
  });

program
  .command('reset')
  .description('Reset the current blockchain to start over')
  .action(() => {
    Geth.cleanup('./fixtures/ethereum/geth');
    console.log('Cleaned up');
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
