import test from 'ava';
import * as fs from 'fs-extra';

import * as shell from '../../../lib/utils/shell';

test('should be able to start detached process', async t => {
  shell.execute({command: 'node', options: ['data/tests/exec.js']}, 'exec.log');
  await new Promise<void>(resolve => {
    setTimeout(() => {
      t.is(fs.readFileSync('exec.log').toString().trim(), 'output');
      resolve();
    }, 500);
  });
});

test.after.always(t => {
  fs.removeSync('exec.log');
});
