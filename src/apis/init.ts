import * as path from 'path';

import * as fs from 'fs-extra';
import * as Listr from 'listr';

import { createGenesis, init } from '../backend/ethereum';
import Config from '../config';
import { IEnvConfig } from '../config/schema';
import { error } from '../lib/utils/logging';

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
          init(config.datadir, config.backend!);
          subtask.title = 'Created local test network';
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
      for (const key of Object.keys(envs)) {
        const data = envs[key];
        const subtask = data.local ?
          localSetupTask(key, data) : remoteSetupTask(key, data);
        subtasks.push(subtask);
      }
      return new Listr(subtasks);
    },
  }]);

  tasks.run().catch(err => {
    error(err);
  });
}
