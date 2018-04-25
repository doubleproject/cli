import { BigNumber } from 'bignumber.js';
import * as Listr from 'listr';
import * as rp from 'request-promise';
import { table } from 'table';

import Config from '../config';
import { IEnvConfig, IProjectConfig } from '../config/schema';
import { IMonitoredNodeStatus } from '../monitor';

function makeJSONRPCRequest(method: string, params: string[]): any {
  return {
    headers: {
      'content-type': 'application/json',
    },
    json: {
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    },
  };
}

export interface IAccountBalance {
  /** The account address */
  account: string;

  /** The balance at this address (in Wei) */
  balance: BigNumber;
}

export interface IProjectStatus {
  /** The balances of accounts owned by nodes in the project */
  balances: IAccountBalance[];

  /** The project configuration */
  projConfig: IProjectConfig;

  /** The name of the configuration */
  environment: string;

  /** The environment configuraiton */
  envConfig: IEnvConfig;

  /** The current block number of the network */
  blockNumber: BigNumber;

  /** The current protocol version of the network */
  protocolVersion: BigNumber;
}

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
export async function cli(env: string): Promise<IProjectStatus | undefined> {
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
    getAliveNodesTask(),
    getExistingAccountsTask(),
    getBalancesTask(),
    getBlockNumberTask(),
    getProtocolVersionTask(),
  ]);

  try {
    const ctx = await tasks.run();
    const status = {
      balances: ctx.allBalances,
      projConfig: ctx.projConfig,
      environment: ctx.env,
      envConfig: ctx.envConfig,
      blockNumber: ctx.blockNumber,
      protocolVersion: ctx.protocolVersion,
    };

    console.log(renderTable(status));
    return status;
  } catch (err) {
    console.error(err.message);
    return undefined;
  }
}

/**
 * Use
 */
function renderTable(status: IProjectStatus): string {
  const tableData: any[] = [];

  tableData.push(
    ['Project', status.projConfig.project, '']);
  tableData.push(
    ['Chain', status.projConfig.chain, '']);
  tableData.push(
    ['Backend', status.projConfig.backend, '']);
  tableData.push(
    ['Environment', status.environment, '']);
  tableData.push(
    ['Mode', status.envConfig.local ? 'local' : 'remote', '']);

  status.envConfig.hosts.forEach((host, idx) => {
    tableData.push([`Node[${idx}]`, host, '']);
  });

  status.balances.forEach((acctBalance, idx) => {
    tableData.push([`Account[${idx}]`, acctBalance.account, acctBalance.balance.toString()]);
  });

  tableData.push(
    ['Current Block Number', status.blockNumber.toString(), '']);
  tableData.push(
    ['Protocol Version', status.protocolVersion.toString(), '']);

  return table(tableData);
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
        const accountResp = await rp.post(`http://${node.address}`,
                                          makeJSONRPCRequest('eth_accounts', []));

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
        const resp = await rp.post(`http://${node.address}`,
                                   makeJSONRPCRequest('eth_getBalance', [acct, 'latest']));

        return new BigNumber(resp.result);
      }));

      const acctsWithBalances: IAccountBalance[] = accounts.map((acct, idx) => {
        return {
          account: acct,
          balance: balances[idx],
        };
      });

      ctx.allBalances = acctsWithBalances;
    },
  };
}

/**
 * Use JSON-RPC to get the current block number. Sets the `blockNumber`
 * property on context.
 */
function getBlockNumberTask(): Listr.ListrTask {
  return {
    title: 'Getting block number',
    skip: ctx => {
      if (!ctx.aliveNodes) {
        return 'There are no alive network nodes to query.';
      }
      return false;
    },
    task: async ctx => {
      const node = ctx.aliveNodes[0];
      const blockNumResp = await rp.post(`http://${node.address}`,
                                         makeJSONRPCRequest('eth_blockNumber', []));
      ctx.blockNumber = new BigNumber(blockNumResp.result);
    },
  };
}

/**
 * Use JSON-RPC to get the ethereum protocol version. Sets the `protocolVersion`
 * property on the context.
 */
function getProtocolVersionTask(): Listr.ListrTask {
  return {
    title: 'Getting protocol version',
    skip: ctx => {
      if (!ctx.aliveNodes) {
        return 'There are no alive network nodes to query.';
      }
      return false;
    },
    task: async ctx => {
      const node = ctx.aliveNodes[0];
      const protocolVersionResp = await rp.post(`http://${node.address}`,
                                            makeJSONRPCRequest('eth_protocolVersion', []));
      ctx.protocolVersion = new BigNumber(protocolVersionResp.result);
    },
  };
}
