#!/usr/bin/env node

import * as program from 'commander';
import { version } from 'pjson';

import { executeSync, info } from './lib/utils/shell';

import * as clean from './apis/clean';
import * as init from './apis/init';
import * as start from './apis/start';
import * as status from './apis/status';

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
    clean.cli(env);
  });

program
  .command('start [env]')
  .description('Start a local environment')
  .action(() => {
    start.cli();
  });

program
  .command('status')
  .description('Get system and project status')
  .action(() => {
    status.cli();
  });

program.parse(process.argv);

if (program.args.length === 0) {
  program.help();
}
