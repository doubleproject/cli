import * as fs from 'fs-extra';

import { test } from 'ava';
import * as rp from 'request-promise';
import * as rimraf from 'rimraf';
import { IMonitoredNodeStatus, Monitor } from '../monitor';
import { MockGeth } from './utils/geth';

let port = 8080;
const K_HEARTBEAT_INTERVAL = 1000;
const K_FAILURE_TOLERANCE = 5;

interface ITestContext {
  server1: MockGeth;
  server2: MockGeth;
  monitor: Monitor;
  config: IMonitoredNodeStatus[];
  server1Port: number;
  server2Port: number;
  monitorPort: number;
}

test.beforeEach('Starting servers...', async t => {
  const mockServer1 = new MockGeth('999');
  const mockServer2 = new MockGeth('999');

  const port1 = port++;
  const port2 = port++;
  const port3 = port++;

  const config = [
    {
      address: `localhost:${port1}`,
      reviveCmd: 'touch',
      reviveArgs: 'server1',
    },
    {
      address: `localhost:${port2}`,
      reviveCmd: 'touch',
      reviveArgs: 'server2',
    },
  ];

  fs.ensureFileSync('testconfig.jl');

  const monitor = new Monitor(
    config, 'testconfig.jl', K_HEARTBEAT_INTERVAL, K_FAILURE_TOLERANCE,
  );

  t.context = {
    server1: mockServer1,
    server2: mockServer2,
    monitor,
    config,
  };

  const context = t.context as ITestContext;

  context.server1.start(port1);
  context.server2.start(port2);
  context.monitor.start(port3);

  context.server1Port = port1;
  context.server2Port = port2;
  context.monitorPort = port3;

  // Sleep for 1 second to let the monitor catch up.
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });
});

test.afterEach.always('Shutting down servers...', async t => {
  const context = t.context as ITestContext;

  context.server1.stop();
  context.server2.stop();
  context.monitor.stop();

  rimraf.sync('server1');
  rimraf.sync('server2');

  rimraf.sync('testconfig.jl');

  // Sleep for 1 second to let the monitor catch up.
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });
});

test.serial('monitor should report alive for both servers', async t => {
  const context = t.context as ITestContext;

  const body = await rp.get({
    url: `http://localhost:${context.monitorPort}/status`,
    headers: {
      Connection: 'close',
    },
  });

  const status = JSON.parse(body) as IMonitoredNodeStatus[];

  t.is(status[0].alive, true);
  t.is(status[1].alive, true);
});

test.serial('monitor should report dead for dead servers', async t => {
  const context = t.context as ITestContext;
  context.server1.stop();

  await new Promise<void>(resolve => {
    setTimeout(() =>
      resolve(), K_HEARTBEAT_INTERVAL * (K_FAILURE_TOLERANCE + 1),
    );
  });

  const body = await rp.get({
    url: `http://localhost:${context.monitorPort}/status`,
  });

  const status = JSON.parse(body) as IMonitoredNodeStatus[];

  t.is(status[0].alive, false);
  t.is(status[1].alive, true);

  const triedToReviveServer1 = fs.existsSync('server1');
  const triedToReviveServer2 = fs.existsSync('server2');

  t.is(triedToReviveServer1, true);
  t.is(triedToReviveServer2, false);
});

test.serial('monitor /add request should add a monitored instance', async t => {
  const context = t.context as ITestContext;

  await rp.post({
    url: `http://localhost:${context.monitorPort}/add`,
    json: {
      nodes: [
        {
          address: 'localhost:9000',
          reviveCmd: 'touch',
          reviveArgs: 'addedServer',
        },
      ],
    },
  });

  const body = await rp.get({
    url: `http://localhost:${context.monitorPort}/status`,
  });

  const status = JSON.parse(body) as IMonitoredNodeStatus[];

  t.is(status[0].alive, true);
  t.is(status[1].alive, true);
  t.is(status[2].alive, false);

  await new Promise<void>(resolve => {
    setTimeout(() =>
      resolve(), K_HEARTBEAT_INTERVAL * (K_FAILURE_TOLERANCE + 1),
    );
  });

  const triedToReviveAddedServer = fs.existsSync('addedServer');
  t.is(triedToReviveAddedServer, true);

  const configData = await fs.readFile('testconfig.jl');
  t.is(configData.includes('localhost:9000'), true);

  rimraf.sync('addedServer');
});

test.serial(
  'monitor should not revive node before reaching failure tolerance',
  async t => {

  const context = t.context as ITestContext;
  context.server1.stop();

  await new Promise<void>(resolve => {
    setTimeout(() =>
      resolve(), K_HEARTBEAT_INTERVAL * (K_FAILURE_TOLERANCE - 2),
    );
  });

  const body = await rp.get({
    url: `http://localhost:${context.monitorPort}/status`,
  });

  const status = JSON.parse(body) as IMonitoredNodeStatus[];

  t.is(status[0].alive, false);

  const triedToReviveServer1 = fs.existsSync('server1');
  t.is(triedToReviveServer1, false);
});
