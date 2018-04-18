import test from 'ava';

import Geth from '../../../backend/ethereum/geth';

test('start script should contain correct flags', t => {
  const flags = {
    nodiscover: true,
    rpc: true,
    rpcport: 8546,
    rpcapi: ['web3', 'eth'],
    port: 30304,
    identity: 'boson',
  };
  t.deepEqual(Geth.startScript(flags), {
    command: 'geth',
    options: [
      'console',
      '--nodiscover', '--port', '30304', '--identity', 'boson',
      '--rpc', '--rpcport', '8546', '--rpcapi', 'web3,eth',
    ],
  });
});

test('start script should ignore RPC flags if RPC is not enabled', t => {
  const flags = {
    nodiscover: true,
    rpcport: 8546,
    rpcapi: ['web3', 'eth'],
    port: 30304,
    identity: 'boson',
  };
  t.deepEqual(Geth.startScript(flags), {
    command: 'geth',
    options: [
      'console', '--nodiscover', '--port', '30304', '--identity', 'boson',
    ],
  });
});
