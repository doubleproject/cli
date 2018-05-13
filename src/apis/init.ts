import * as path from 'path';

import * as fs from 'fs-extra';
import * as Listr from 'listr';

import * as backend from '../backend';
import Config from '../config';
import { IEnvConfig } from '../config/schema';
import { untildify } from '../lib/utils/compat';
import { error } from '../lib/utils/logging';

/**
 * Task for creating accounts.
 *
 * For each environment, we set up 5 accounts for user to use. If there appears
 * to be existing accounts (either accounts.json or keystore folder) for an
 * environment, this task is skipped.
 *
 * @param {string} name - The name of the environment.
 * @param {IEnvConfig} config - The configuration of the environment.
 * @returns {Listr.ListrTask} The listr task.
 */
function createAccountTask(name: string, config: IEnvConfig): Listr.ListrTask {
  const datadir = untildify(config.datadir);
  return {
    title: `Creating accounts for ${name} environment`,
    skip: ctx => {
      if (fs.existsSync(path.join(datadir, 'accounts.json')) ||
          fs.existsSync(path.join(datadir, 'keystore'))) {
        return 'Found existing account definition in accounts.json/keystore';
      }
      return undefined;
    },
    task: (ctx, task) => {
      backend.createAccounts(config.chain!, datadir);
      task.title = `Created accounts for ${name} environment`;
    },
  };
}

function createGenesisTask(name: string, config: IEnvConfig): Listr.ListrTask {
  const datadir = untildify(config.datadir);
  return {
    title: `Setting up genesis config for ${name} environment`,
    skip: () => {
      if (!config.local) {
        return 'Remote environment requires no genesis config';
      }
      return undefined;
    },
    task: (ctx, task) => {
      return new Listr([{
        title: 'Checking genesis block configuration',
        skip: () => {
          if (fs.existsSync(path.join(datadir, 'genesis.json'))) {
            return 'Found existing genesis.json file';
          }
          return undefined;
        },
        task: (_, subtask) => {
          backend.createGenesis(config.chain!, datadir);
          subtask.title = `Created genesis.json file for ${name} environment`;
        },
      }, {
        title: `Initializing genesis block for ${name} network`,
        task: (_, subtask) => {
          backend.init(config.chain!, config.datadir, config.backend!);
          subtask.title = 'Created local test network';
        },
      }]);
    },
  };
}

function envSetupTask(name: string, config: IEnvConfig): Listr.ListrTask {
  return {
    title: `Setting up ${name} environment`,
    task: (ctx, task) => {
      return new Listr([
        createAccountTask(name, config),
        createGenesisTask(name, config),
      ]);
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
        subtasks.push(envSetupTask(key, envs[key]));
      }
      return new Listr(subtasks);
    },
  }]);

  tasks.run().catch(err => {
    error(err);
  });
}
