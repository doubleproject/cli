import * as path from 'path';

import test from 'ava';

import Geth from '../../../backend/ethereum/geth';

test('init script should contain correct flags', t => {
  const genesis = `datadir${path.sep}genesis.json`;
  t.deepEqual(Geth.initScript('datadir'), {
    command: 'geth',
    options: ['--datadir', 'datadir', 'init', genesis],
  });
});

test('start script should contain correct flags', t => {
  const flags = {
    nodiscover: true,
    rpc: true,
    rpcport: 8546,
    rpcaddr: '0.0.0.0',
    rpccorsdomain: ['doublechain.org', 'google.com'],
    rpcapi: ['web3', 'eth'],
    port: 30304,
    maxpeers: 10,
    identity: 'double',
    datadir: 'double-data',
    networkid: 1,
  };
  t.deepEqual(Geth.startScript(flags), {
    command: 'geth',
    options: [
      '--nodiscover', '--maxpeers', '10', '--port', '30304', '--identity',
      'double', '--datadir', 'double-data', '--networkid', '1',
      '--rpc', '--rpcaddr', '0.0.0.0', '--rpcport', '8546', '--rpcapi',
      'web3,eth', '--rpccorsdomain', 'doublechain.org,google.com',
    ],
  });
});

test('start script without flags should be correct', t => {
  t.deepEqual(Geth.startScript({}), {
    command: 'geth',
    options: [],
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
    options: ['--nodiscover', '--port', '30304', '--identity', 'boson'],
  });
});
