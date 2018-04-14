import { spawnSync, SpawnSyncReturns } from 'child_process';
import chalk from 'chalk';

export interface ISpawnInput {
  command: string;
  options: string[];
}

export function executeSync(input: ISpawnInput) : SpawnSyncReturns<Buffer> {
  return spawnSync(input.command, input.options, {stdio: 'inherit'});
}

export function info(message: string) {
  console.log('boson' + chalk.green(' INFO ') + message);
}

export function fatal(message: string) {
  console.log('boson' + chalk.red(' FATAL ') + message);
}
