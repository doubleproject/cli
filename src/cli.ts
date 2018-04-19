#!/usr/bin/env node

import * as program from 'commander';
import { version } from 'pjson';

import { ETHEREUM_DATADIR } from './data';
import Locator from './lib/utils/locator';
import { executeSync, info } from './lib/utils/shell';

import * as init from './apis/init';
import * as status from './apis/status';
import Geth from './backend/ethereum/geth';

program.version(version);

program
  .command('list')
  .description('List available networks')
  .action(() => {
    executeSync({command: 'geth', options: ['account', 'list']});
  });

program
  .command('init')
  .description('Initialize a blockchain by creating the genesis block')
  .action(() => {
    info('Creating genesis block for chain');
    init.cli();
  });

program
  .command('clean [env]')
  .description('Clean a project or an environment, restoring it to init state')
  .action(env => {
    Geth.cleanup(ETHEREUM_DATADIR);
    console.log('Cleaned up');
  });

program
  .command('start')
  .description('Start a new node')
  .action(() => {
    const command = Geth.startScript({
      datadir: ETHEREUM_DATADIR,
      identity: 'boson',
      nodiscover: true,
      rpc: true,
    });
    executeSync(command);
  });

program
  .command('status')
  .description('Get system and project status')
  .action(() => {
    status.cli();
  });

// This is just a temporary convenient entrypoint to test the locator out
program
  .command('search <name>')
  .description('Search for the executable')
  .action(name => {
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
}
