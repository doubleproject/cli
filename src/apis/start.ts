import * as ethereum from '../backend/ethereum';
import Config from '../config';
import { IEnvConfig, IProjectConfig } from '../config/schema';

export function cli(env?: string) {
  const cfg = Config.get();
  let envcfg: IEnvConfig;

  if (env) {
    if (!cfg.envs[env]) {
      throw new Error(`Invalid environment to start: ${env}`);
    }
    if (!cfg.envs[env].local) {
      throw new Error('Only local environments can be started');
    }
    envcfg = cfg.envs[env];
  } else {
    const envs = [];
    for (const key of Object.keys(cfg.envs)) {
      if (cfg.envs[key].local) {
        envs.push(key);
      }
    }
    if (envs.length === 0) {
      throw new Error('Project has no local environment');
    }
    if (envs.length > 1) {
      startMulti(cfg, envs);
      return;
    }
    envcfg = cfg.envs[envs[0]];
  }

  if (envcfg.chain === 'ethereum') {
    ethereum.start(envcfg);
  } else {
    throw new Error(`Invalid chain ${envcfg.chain}`);
  }
}

function startMulti(cfg: IProjectConfig, envs: string[]) {
  console.log('hello');
}
