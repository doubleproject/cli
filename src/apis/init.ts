import * as path from 'path';

import * as fs from 'fs-extra';
import * as Listr from 'listr';

import { createGenesis } from '../backend/ethereum';
import Geth from '../backend/ethereum/geth';
import Config from '../config';
import { IEnvConfig } from '../config/schema';
import { error, executeSync } from '../lib/utils/shell';

function localSetupTask(name: string, config: IEnvConfig): Listr.ListrTask {
  return {
    title: `Setting up ${name} environment`,
    task: (ctx, task) => {
      return new Listr([{
        title: 'Checking genesis block configuration',
        skip: () => {
          if (fs.existsSync(path.join(config.datadir, 'genesis.json'))) {
            return 'Found existing genesis.json file';
          }
          return undefined;
        },
        task: (_, subtask) => {
          createGenesis(config.datadir);
          subtask.title = `Created genesis.json file for ${name} environment`;
        },
      }, {
        title: `Initializing genesis block for ${name} network`,
        skip: () => {
          return undefined;
        },
        task: (_, subtask) => {
          const command = Geth.initScript(config.datadir);
          const response = executeSync(command);
          if (response.status === 0) {
            subtask.title = 'Created local test network';
          } else {
            throw new Error('Unable to initialize local network');
          }
        },
      }]);
    },
  };
}

function remoteSetupTask(name: string, config: IEnvConfig): Listr.ListrTask {
  return {
    title: `Setting up environment ${name}`,
    task: (ctx, task) => {
      task.title = 'Nothing to do for remote environment';
    },
  };
}

/**
 * CLI entrypoint for initializing a project.
 *
 * This creates a double.yaml file in the current folder that contains configs
 * for the project. If such file already exists, it will be used. Then if a
 * local environment is specified, the network will be initialized.
 */
export function cli() {
  const tasks = new Listr([{
    title: 'Setting up Double configuration',
    skip: ctx => {
      if (fs.existsSync('double.yaml')) {
        ctx.config = Config.get();
        return 'Using existing double.yaml file';
      }
      return undefined;
    },
    task: (ctx, task) => {
      ctx.config = Config.init(path.basename(path.resolve()));
      task.title = 'Created double.yaml with default configuration';
    },
  }, {
    title: 'Setting up environments',
    task: (ctx, task) => {
      const subtasks = [];
      const envs = ctx.config.envs;
      for (const env in envs) {
        if (envs.hasOwnProperty(env)) {
          const data = envs[env];
          const subtask = data.local ?
            localSetupTask(env, data) : remoteSetupTask(env, data);
          subtasks.push(subtask);
        }
      }
      return new Listr(subtasks);
    },
  }]);

  tasks.run().catch(err => {
    error(err);
  });
}
