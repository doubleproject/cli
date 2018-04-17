import * as fs from 'fs';
import * as path from 'path';

import * as Listr from 'listr';

import { Geth } from '../backend/ethereum/geth';
import Config from '../config';
import { error, executeSync } from '../lib/utils/shell';

/**
 * CLI entrypoint for initializing a project.
 *
 * This creates a double.yaml file in the current folder that contains configs
 * for the project. If such file already exists, it will be used. Then if a
 * local environment is specified, the network will be initialized.
 */
export function cli() {
  const tasks = new Listr([
    {
      title: 'Setting up Double configuration',
      skip: () => {
        if (fs.existsSync('double.yaml')) {
          return 'Using existing double.yaml file';
        }
        return undefined;
      },
      task: (ctx, task) => {
        ctx.config = Config.init(path.basename(path.resolve()));
        task.title = 'Created double.yaml with default configuration';
      },
    },
    {
      title: 'Checking genesis block configuration',
      skip: () => {
        if (fs.existsSync('')) {
          return 'Found existing genesis.json file';
        }
        return undefined;
      },
      task: (ctx, task) => {
        return;
      },
    },
    {
      title: 'Creating local test network',
      task: (ctx, task) => {
        const command = Geth.initScript('./fixtures/ethereum', './fixtures/ethereum/genesis.json');
        const response = executeSync(command);
        if (response.status === 0) {
          task.title = 'Created local test network';
        } else {
          throw new Error('Unable to initialize local network');
        }
      },
    },
  ]);

  tasks.run().catch(err => {
    error(err);
  });
}
