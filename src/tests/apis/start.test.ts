import * as process from 'process';

import test from 'ava';
import * as fs from 'fs-extra';

import * as start from '../../apis/start';
// import run, { DOWN, ENTER } from '../utils/inquirer';

test.before(t => {
  fs.copySync('data/tests/multi.yaml', 'start-test/double.yaml');
  process.chdir('start-test');
});

test('should not be able to start invalid environment', t => {
  t.throws(() => {
    start.cli('invalid');
  });
});

test('should not be able to start remote environment', t => {
  t.throws(() => {
    start.cli('remote');
  });
});

// test('should be able to select from multiple envs', async t => {
//   await run(['start'], [DOWN, DOWN, ENTER]);
// });

test('should not be able to start invalid chain', t => {
  t.throws(() => {
    start.startSingle('invalid', {
      chain: 'invalid', datadir: '', hosts: [],
    });
  });
});

test.after.always(t => {
  process.chdir('..');
  fs.removeSync('start-test');
});
