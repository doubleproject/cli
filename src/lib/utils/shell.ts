import { spawnSync, SpawnSyncReturns } from 'child_process';

import chalk from 'chalk';

export interface ISpawnInput {
  command: string;
  options: string[];
}

export function executeSync(input: ISpawnInput): SpawnSyncReturns<Buffer> {
  return spawnSync(input.command, input.options, {stdio: 'inherit'});
}

export function info(message: string) {
  console.log(chalk.bgCyan('boson') + chalk.cyan(' INFO ') + message);
}

export function error(message: string) {
  console.log(chalk.bgCyan('boson') + chalk.red(' ERROR ') + message);
}
