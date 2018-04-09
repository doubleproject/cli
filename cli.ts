#!/usr/bin/env node

import * as program from 'commander';

program.version('0.1.0');

program
  .command('list')
  .description('List available networks')
  .action(() => {
    console.log('Boson list command');
  });

program
  .command('init')
  .description('Set up a new network')
  .action(() => {
    console.log('Boson init command');
  });

program.parse(process.argv);
