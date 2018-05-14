#!/usr/bin/env node

import * as program from 'commander';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import { version } from 'pjson';

import { info } from './lib/utils/logging';
import { execute, executeSync } from './lib/utils/shell';

import * as clean from './apis/clean';
import * as init from './apis/init';
import * as start from './apis/start';
import * as status from './apis/status';
import * as Monitor from './monitor';

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
  .action(async () => {
    try {
      // Check if monitor is already running.
      await Monitor.scanForMonitor();
    } catch (err) {
      const port = await Monitor.getFirstAvailablePortForMonitor();
      const monitorConfigFile = path.join(os.homedir(), '.double', 'monitor.jl');
      const monitorLog = path.join(os.homedir(), '.double', 'monitor.log');
      const monitorStdoutStderrLog = path.join(os.homedir(), '.double', 'monitor-stdout-stderr.log');
      fs.ensureFileSync(monitorConfigFile);
      fs.ensureFileSync(monitorLog);
      execute({
        command: 'node',
        options: ['dist/monitor.js', `${port}`, monitorConfigFile, monitorLog],
      }, monitorStdoutStderrLog);
    }

    await Monitor.waitForAliveMonitor();

    start.cli();
  });

program
  .command('status [env]')
  .description('Get system and project status')
  .action(env => {
    status.cli(env);
  });

program.parse(process.argv);

if (program.args.length === 0) {
  program.help();
}
