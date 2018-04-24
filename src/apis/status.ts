import { BigNumber } from 'bignumber.js';
import * as Listr from 'listr';
import * as rp from 'request-promise';

import Config from '../config';
import { IEnvConfig, IProjectConfig } from '../config/schema';
import { IMonitoredNodeStatus } from '../monitor';

/**
 * CLI entrypoint for boson status.
 *
 * Things to display:
 *
 * - Status of boson monitoring process.
 * - Currently running local networks/nodes.
 * - Account information.
 * - Useful commands.
 *
 * @param env The name of the environment we are showing status for
 */
export function cli(env: string) {
  const tasks = new Listr([
    {
      title: 'Reading Double configuration',
      task: ctx => {
        try {
          Config.get();
        } catch (err) {
          throw new Error(`Cannot find any project configuration, please run boson init`);
        }

        try {
          Config.getForEnv(env);
        } catch (err) {
          throw new Error(`Cannot find environment named ${env}, please check your configuration.`);
        }

        ctx.projConfig = Config.get();
        ctx.envConfig = Config.getForEnv(env);
        ctx.env = env;

      },
    },
    getProjectInfoTask(),
    getAliveNodesTask(),
    getExistingAccountsTask(),
    getBalancesTask(),
  ]);

  tasks.run()
    .then(ctx => {
      // TODO: Log this information in a more user friendly format.
      console.log(ctx.projectInfo);
      console.log(ctx.allBalances);
    })
    .catch(err => {
      console.log(err.message);
  });
}

function getProjectInfoTask(): Listr.ListrTask {
  return {
    title: 'Getting project information',
    task: ctx => {
      const projConfig = ctx.projConfig as IProjectConfig;
      const env = ctx.env as string;

      const envConfig = ctx.envConfig as IEnvConfig;

      const projectInfo = `Project: ${projConfig.project}\
\nBackend: ${projConfig.backend}\
\nChain: ${projConfig.chain}`;

      let envInfo = `Environment: ${env}\
\nDatadir: ${envConfig.datadir}`;

      envConfig.hosts.forEach((host, idx) => {
        envInfo += `\nHost[${idx}] = ${host}`;
      });

      ctx.projectInfo = projectInfo + '\n' + envInfo;
    },
  };
}

/**
 * Logs network information.
 *
 * - Local network condition:
 *   - If there's an active local network, display it.
 *   - Otherwise, if there's a project configuration:
 *     - If local network is specified, let user run boson start.
 *     - Otherwise tell user about global config.
 *   - Otherwise, let user run boson init or use the global config.
 * - Remote network condition:
 *   - If there's a project configuration that contains remote network, show
 *     its status.
 */
function getAliveNodesTask(): Listr.ListrTask {
  return {
    title: 'Getting network information',
    skip: ctx => {
      const envConfig = ctx.envConfig as IEnvConfig;
      if (typeof envConfig.monitorPort === 'undefined') {
        throw new Error('Double monitor port is not specified!');
      }
    },
    task: async ctx => {
      const envConfig = ctx.envConfig as IEnvConfig;
      const nodeStatuses = await rp.get(`http://localhost:${envConfig.monitorPort}/status`);
      const nodeStatusesJSON = JSON.parse(nodeStatuses) as IMonitoredNodeStatus[];
      const aliveNodes = nodeStatusesJSON.filter(node => node.alive);

      if (aliveNodes.length === 0) {
        if (envConfig.local) {
          throw new Error('All local nodes are down, please run boson start');
        } else {
          throw new Error('All remote nodes are down, please double check if their addresses are correct');
        }
      } else {
        ctx.aliveNodes = aliveNodes;
      }
    },
  };
}

/**
 * Use JSON-RPC to query the existing accounts on the network.  Sets the
 * `allAccounts` property on `ctx` if successfully executed.
 */
function getExistingAccountsTask(): Listr.ListrTask {
  return {
    title: 'Getting all accounts',
    skip: ctx => {
      if (!ctx.aliveNodes) {
        return 'There are no alive network nodes to query.';
      }
      return false;
    },
    task: async ctx => {
      const aliveNodes = ctx.aliveNodes as IMonitoredNodeStatus[];
      const responses = await Promise.all<string[]>(aliveNodes.map(async node => {
        const accountResp = await rp.post(`http://${node.address}`, {
          headers: {
            'content-type': 'application/json',
          },
          json: {
            jsonrpc: '2.0',
            method: 'eth_accounts',
            params: [],
            id: 1,
          },
        });

        return accountResp.result;
      }));

      ctx.allAccounts = responses.reduce((accum, accts) => {
        return accum.concat(accts);
      }, []);
    },
  };
}

/**
 * Use JSON-RPC to query the balances of accounts on the network.
 * Sets the `allBalances` property on context.
 */
function getBalancesTask(): Listr.ListrTask {
  return {
    title: 'Getting balances',
    skip: ctx => {
      if (!ctx.allAccounts) {
        return 'There are no accounts to retrive balances for';
      }
      return false;
    },
    task: async ctx => {
      const node = ctx.aliveNodes[0];
      const accounts = ctx.allAccounts as string[];
      const balances = await Promise.all<BigNumber>(accounts.map(async acct => {
        const resp = await rp.post(`http://${node.address}`, {
          headers: {
            'content-type': 'application/json',
          },
          json: {
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [acct, 'latest'],
            id: 1,
          },
        });

        return new BigNumber(resp.result);
      }));

      const acctsWithBalances = accounts.map((acct, idx) => {
        return {
          account: acct,
          balance: balances[idx],
        };
      });

      ctx.allBalances = acctsWithBalances;
    },
  };
}
