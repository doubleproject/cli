import test from 'ava';

import * as start from '../../apis/start';
import Config from '../../config';
// import run, { DOWN, ENTER } from '../utils/inquirer';

test('should not be able to start invalid environment', t => {
  t.throws(() => {
    start.cli('invalid');
  });
});

test('should not be able to start remote environment', t => {
  t.throws(() => {
    const cfg = Config.parseFromFile('data/tests/multi.yaml');
    start.startForConfig(cfg, 'remote');
  });
});

test('should fail for config without local environment', t => {
  t.throws(() => {
    const cfg = Config.parseFromFile('data/tests/remote.yaml');
    start.startForConfig(cfg);
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
