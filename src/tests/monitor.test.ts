// import * as fs from 'fs';

import { test } from 'ava';
import * as request from 'request';
import { IMonitoredNodeStatus, Monitor } from '../monitor';
import { MockGeth } from './mockgeth';

let port = 8080;

type TestContext = {
  server1: MockGeth,
  server2: MockGeth,
  monitor: Monitor,
  config: IMonitoredNodeStatus[],
  server1Port: number,
  server2Port: number,
  monitorPort: number,
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
  const monitor = new Monitor(config);

  t.context = {
    server1: mockServer1,
    server2: mockServer2,
    monitor: monitor,
    config: config,
  };

  const context = t.context as TestContext;

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
  const context = t.context as TestContext;

  context.server1.stop();
  context.server2.stop();
  context.monitor.stop();

  // Sleep for 1 second to let the monitor catch up.
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });
});

test('Monitor should report alive for both servers', async t => {
  const context = t.context as TestContext;

  return new Promise<void>((resolve) => {
    request
      .get({
        url: `http://localhost:${context.monitorPort}/status`,
        headers: {
          Connection: 'close',
        },
      }, (err, resp, body) => {
        const status = JSON.parse(body) as IMonitoredNodeStatus[];

        t.is(status[0].alive, true);
        t.is(status[1].alive, true);

        resolve();
      });
  });
});

test('Monitor should report dead for dead servers', async t => {
  return new Promise<void>((resolve) => {
    const context = t.context as TestContext;

    console.log(`Server1 running on port: ${context.server1Port}`);
    console.log('Stopping server1...');
    context.server1.stop();

    setTimeout(() => {
      console.log('Getting another status...');
      request
        .get({
          url: `http://localhost:${context.monitorPort}/status`,
          headers: {
            Connection: 'close',
          }
        }, (err, resp, body) => {
          const status = JSON.parse(body) as IMonitoredNodeStatus[];

          console.log(status);

          t.is(status[0].alive, false);
          t.is(status[1].alive, true);
          resolve();
        });
    }, 6000);
  });
});
