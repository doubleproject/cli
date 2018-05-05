import test from 'ava';

import * as clean from '../../apis/clean';

test('cleaning invalid environment from default project should fail', t => {
  t.throws(() => {
    clean.cli('nonexistent');
  });
});
