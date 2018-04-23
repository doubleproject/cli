import test from 'ava';

import * as start from '../../apis/start';
// import run, { DOWN, ENTER } from '../utils/inquirer';

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
