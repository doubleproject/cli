import * as process from 'process';

import test from 'ava';
import * as fs from 'fs-extra';

test.before(t => {
  process.chdir('init-test');
});

test('should be able to initialize environment', async t => {
  t.true(true);
});

test.after.always(t => {
  process.chdir('..');
  fs.removeSync('init-test');
});
