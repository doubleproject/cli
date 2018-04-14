import * as fs from 'fs';
import * as Listr from 'listr';

import { error, executeSync } from '../lib/utils/shell';
import { Geth } from '../backend/ethereum/geth';

/**
 * CLI entrypoint for initializing a project.
 * 
 * This creates a boson.yaml file in the current folder that contains configs
 * for the project. If such file already exists, it will be used. Then if a
 * local environment is specified, the network will be initialized.
 */
export function cli() {
  const tasks = new Listr([
    {
      title: 'Setting up Boson configuration',
      task: (ctx, task) => {
        task.title = 'Created Boson config file at boson.yaml';
      },
      skip: () => {
        if (fs.existsSync('boson.yaml')) {
          return 'Existing boson.yaml file found and will be used';
        }
        return undefined;
      }
    },
    {
      title: 'Checking genesis block configuration',
      task: (ctx, task) => {
        
      }
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
      }
    }
  ]);

  tasks.run().catch(err => {
    error(err);
  });
}
