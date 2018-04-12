import { spawnSync, SpawnSyncReturns } from 'child_process';

export interface ISpawnInput {
  command: string;
  options: string[];
}

export function executeSync(input: ISpawnInput) : SpawnSyncReturns<Buffer> {
  return spawnSync(input.command, input.options, {stdio: 'inherit'});
}
