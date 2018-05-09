import { test } from 'ava';
import { BigNumber } from 'bignumber.js';
import * as fs from 'fs-extra';

import * as status from '../../apis/status';
import { getFirstAvailablePortForMonitor,
         Monitor,
       } from '../../monitor';
import { EXPECTED_BALANCES,
         EXPECTED_BLOCK_NUMBER,
         EXPECTED_PROTOCOL_VERSION,
         MockGeth,
       } from '../utils/geth';

test.before('Setting up status test directory', () => {
  fs.copySync('data/tests/status.yaml', 'status-test/double.yaml');
  process.chdir('status-test');
});

test.serial('checking status from for non-existent environments should fail', async t => {
  await t.throws(async () => {
    await status.cli('non-existent-env', true);
  });
});

test.serial('checking status without monitor should fail', async t => {
  await t.throws(async () => {
    await status.cli('local', true);
  });
});

test.serial('status should return expected results', async t => {
  const monitor = new Monitor([
    {address: 'localhost:9485', project: 'status-test-project', environment: 'local'},
  ], 'monitor.jl');

  const geth1 = new MockGeth('999');

  const availableMonitorPort = await getFirstAvailablePortForMonitor();

  await geth1.start(9485);
  await monitor.start(availableMonitorPort);

  const networkStatus = await status.cli('local', true);

  t.is(networkStatus.environment, 'local');
  t.is(networkStatus.config.project, 'status-test-project');
  t.is(networkStatus.blockNumber.toString(),
       new BigNumber(EXPECTED_BLOCK_NUMBER).toString());
  t.is(networkStatus.protocolVersion.toString(),
       new BigNumber(EXPECTED_PROTOCOL_VERSION).toString());
  for (const acctBalance of networkStatus.balances) {
    t.is(EXPECTED_BALANCES.hasOwnProperty(acctBalance.account), true);
    t.is(acctBalance.balance.toString(),
         new BigNumber(EXPECTED_BALANCES[acctBalance.account]).toString());
  }
});

test.after('Removing status test directory', () => {
  process.chdir('..');
  fs.removeSync('status-test');
});
