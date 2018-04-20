import test from 'ava';

import * as clean from '../../apis/clean';

// test('should be able to clean default project', t => {
//   t.throws(() => {
//     clean.cli();
//   });
// });

// test('should be able to clean environment in default project', t => {
//   clean.cli('local');
// });

test('cleaning invalid environment from default project should fail', t => {
  t.throws(() => {
    clean.cli('nonexistent');
  });
});
