import test from 'ava';

import Config from '../../config';
import Validator from '../../config/validator';

test('malformed config should fail validation', t => {
  t.throws(() => {
    new Validator().validateProjectConfig({hello: 'world'});
  });
});

test('config loader should add default values', t => {
  const cfg = Config.parseFromFile('data/tests/default.yaml');
  t.is(cfg.chain, 'ethereum');
  t.is(cfg.backend, 'geth');
  t.is(cfg.envs.local.chain, 'ethereum');
  t.is(cfg.envs.local.backend, 'geth');
});

test('invalid chain should fail validation', t => {
  t.throws(() => {
    Config.parseFromFile('data/tests/unsupported1.yaml');
  });
});

test('invalid backend for local environment should fail validation', t => {
  t.throws(() => {
    Config.parseFromFile('data/tests/unsupported2.yaml');
  });
});
