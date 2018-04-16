import * as fs from 'fs';
import * as Listr from 'listr';

import { Geth } from '../backend/ethereum/geth';
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
      title: 'Setting up Boson configuration',
      skip: () => {
        if (fs.existsSync('double.yaml')) {
          return 'Existing double.yaml file found and will be used';
        }
        return undefined;
      },
      task: (ctx, task) => {
        task.title = 'Created Boson config file at double.yaml';
      },
    },
    {
      title: 'Checking genesis block configuration',
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
