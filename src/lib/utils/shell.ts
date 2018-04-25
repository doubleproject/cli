import {
  ChildProcess, spawn, spawnSync, SpawnSyncReturns,
} from 'child_process';

import chalk from 'chalk';
import * as fs from 'fs-extra';

export interface ISpawnInput {
  command: string;
  options: string[];
}

/**
 * Executes a command synchronously, with outputs streamed directly to console.
 *
 * @param {ISpawnInput} input - The subprocess input.
 * @returns {SpawnSyncReturns<Buffer>} The execution result.
 */
export function executeSync(input: ISpawnInput): SpawnSyncReturns<Buffer> {
  return spawnSync(input.command, input.options, {stdio: 'inherit'});
}

/**
 * Executes a command in a child process, streaming its log to a file.
 *
 * @param {ISpawnInput} input - The subprocess input.
 * @param {string} logFile - Location of the output file.
 * @returns {ChildProcess} The subprocess.
 */
export function execute(input: ISpawnInput, logFile: string): ChildProcess {
  fs.ensureFileSync(logFile);
  const out = fs.openSync(logFile, 'a');
  const err = fs.openSync(logFile, 'a');
  const cp = spawn(input.command, input.options, {
    stdio: [ 'ignore', out, err ], detached: true,
  });
  cp.unref();
  return cp;
}

export function info(message: string) {
  console.log(chalk.cyan(' INFO ') + message);
}

export function error(message: string) {
  console.log(chalk.red(' ERROR ') + message);
}
