import test from 'ava';

import * as start from '../../apis/start';

test('should not be able to start invalid chain', t => {
  t.throws(() => {
    start.startSingle('invalid', {
      chain: 'invalid', datadir: '', hosts: [],
    });
  });
});
