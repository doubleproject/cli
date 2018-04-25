import { spawn, spawnSync, SpawnSyncReturns } from 'child_process';
import * as fs from 'fs';

import chalk from 'chalk';

export interface ISpawnInput {
  command: string;
  options: string[];
}

export function executeSync(input: ISpawnInput): SpawnSyncReturns<Buffer> {
  return spawnSync(input.command, input.options, {stdio: 'inherit'});
}

export function execute(input: ISpawnInput, logFile: string) {
  const stream = fs.createWriteStream(logFile, {flags: 'a'});
  const cmd = spawn(input.command, input.options);
  cmd.stdout.pipe(stream);
  cmd.stderr.pipe(stream);
}

export function info(message: string) {
  console.log(chalk.bgCyan('boson') + chalk.cyan(' INFO ') + message);
}

export function error(message: string) {
  console.log(chalk.bgCyan('boson') + chalk.red(' ERROR ') + message);
}

export function fatal(message: string) {
  console.log('boson' + chalk.red(' FATAL ') + message);
}
