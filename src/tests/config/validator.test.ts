import test from 'ava';

import Validator from '../../config/validator';

test('malformed config should fail validation', t => {
  t.throws(() => {
    new Validator().validateProjectConfig({hello: 'world'});
  });
});
