import * as fs from 'fs-extra';
import * as winston from 'winston';

import { test } from 'ava';
import * as rp from 'request-promise';
import * as sqlite from 'sqlite';
import * as sqlite3 from 'sqlite3';
import { addToMonitor,
         getFirstAvailablePortForMonitor,
         IMonitoredNodeStatus,
         Monitor,
         scanForMonitor,
       } from '../monitor';
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

test.before('Configuring test logger...', () => {
  winston.configure({
    level: 'error',
  });
});

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
      project: 'monitor-test',
      environment: 'local',
    },
    {
      address: `localhost:${port2}`,
      reviveCmd: 'touch',
      reviveArgs: 'server2',
      project: 'monitor-test',
      environment: 'local',
    },
  ];

  const monitor = new Monitor(
    'teststore.sqlite', K_HEARTBEAT_INTERVAL, K_FAILURE_TOLERANCE,
  );

  t.context = {
    server1: mockServer1,
    server2: mockServer2,
    monitor,
    config,
  };

  const context = t.context as ITestContext;

  await Promise.all([
    context.server1.start(port1),
    context.server2.start(port2),
    context.monitor.start(port3)]);

  await addToMonitor(config, port3);

  context.server1Port = port1;
  context.server2Port = port2;
  context.monitorPort = port3;
});

test.afterEach.always('Shutting down servers...', async t => {
  const context = t.context as ITestContext;

  await Promise.all([
    context.server1.stop(),
    context.server2.stop(),
    context.monitor.stop()]);

  fs.removeSync('server1');
  fs.removeSync('server2');

  fs.removeSync('teststore.sqlite');
});

test.serial('monitor should report alive for both servers', async t => {
  const context = t.context as ITestContext;

  await (context.monitor as any).ping();

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
  await context.server1.stop();

  await new Promise<void>(resolve => {
    setTimeout(() => resolve(), K_HEARTBEAT_INTERVAL * (K_FAILURE_TOLERANCE + 2));
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
          project: 'monitor-test',
          environment: 'remote',
        },
      ],
    },
  });

  await new Promise<void>(resolve => {
    setTimeout(() => resolve(), K_HEARTBEAT_INTERVAL * (K_FAILURE_TOLERANCE + 1));
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

  fs.removeSync('addedServer');
});

test.serial(
  'monitor should not revive node before reaching failure tolerance',
  async t => {

  const context = t.context as ITestContext;
  await context.server1.stop();

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

test.serial('monitor stop should be idempotent', async t => {
  const context = t.context as ITestContext;

  await context.monitor.stop();
  await context.monitor.stop();

  t.pass();
});

test.serial('monitor should reject invalid constructor parameters', async t => {
  t.throws(() => {
    const monitor = new Monitor('teststorage.sqlite', -100, -2);
    monitor.stop();
  });

  t.throws(() => {
    const monitor = new Monitor('teststorage.sqlite', 5000, -2);
    monitor.stop();
  });
});

test.serial('scan should return proper port number for running monitor process', async t => {
  const monitor = new Monitor('teststorage2.sqlite');
  await monitor.start(9600);
  const foundPort = await scanForMonitor();
  t.is(foundPort, 9600);
  await monitor.stop();

  fs.removeSync('teststorage2.sqlite');
});

test.serial('scan should throw if no monitor is running', async t => {
  const context = t.context as ITestContext;

  await context.monitor.stop();

  await t.throws(async () => {
    await scanForMonitor();
  });
});

test.serial('get first available monitor port should return a port in range', async t => {
  const availablePort = await getFirstAvailablePortForMonitor();
  t.is(availablePort >= 9545 && availablePort < 9644, true);
});

test.serial('monitor should return nodes with matching projects', async t => {
  const context = t.context as ITestContext;

  const proj1Node = {
    address: 'localhost:9000',
    project: 'proj1',
    environment: 'local',
  };

  const proj2Node = {
    address: 'localhost:9001',
    project: 'proj2',
    environment: 'local',
  };

  await addToMonitor([proj1Node, proj2Node], context.monitorPort);

  const body1 = await rp.get({
    url: `http://localhost:${context.monitorPort}/status/proj1`,
  });
  const status1 = JSON.parse(body1) as IMonitoredNodeStatus[];
  t.is(status1[0].address, 'localhost:9000');

  const body2 = await rp.get({
    url: `http://localhost:${context.monitorPort}/status/proj2`,
  });
  const status2 = JSON.parse(body2) as IMonitoredNodeStatus[];
  t.is(status2[0].address, 'localhost:9001');
});

test.serial('monitor should return nodes with matching environments', async t => {
  const context = t.context as ITestContext;

  const proj1Node = {
    address: 'localhost:9000',
    project: 'proj',
    environment: 'local',
  };

  const proj2Node = {
    address: 'localhost:9001',
    project: 'proj',
    environment: 'remote',
  };

  await addToMonitor([proj1Node, proj2Node], context.monitorPort);

  const body1 = await rp.get({
    url: `http://localhost:${context.monitorPort}/status/proj/local`,
  });
  const status1 = JSON.parse(body1) as IMonitoredNodeStatus[];
  t.is(status1[0].address, 'localhost:9000');
  t.is(status1.length, 1);

  const body2 = await rp.get({
    url: `http://localhost:${context.monitorPort}/status/proj/remote`,
  });
  const status2 = JSON.parse(body2) as IMonitoredNodeStatus[];
  t.is(status2[0].address, 'localhost:9001');
  t.is(status2.length, 1);
});

test.serial('monitor should update configuration with new process id after revival', async t => {
  const context = t.context as ITestContext;

  const newNode = {
    address: 'localhost:9000',
    project: 'testproj',
    environment: 'local',
    reviveCmd: 'echo',
    reviveArgs: 'foobar',
  };

  await addToMonitor([newNode], context.monitorPort);
  await new Promise<void>(resolve => {
    setTimeout(() =>
      resolve(), K_HEARTBEAT_INTERVAL * (K_FAILURE_TOLERANCE + 2),
    );
  });

  await context.monitor.stop();

  const db   = await sqlite.open('teststore.sqlite', { mode: sqlite3.OPEN_READONLY });
  const proc = await db.get(`
SELECT * FROM MonitoredNode WHERE project = $project AND environment = $environment
`, {
  $project: newNode.project,
  $environment: newNode.environment,
});

  await db.close();

  t.truthy(proc.processId);
});
