import test from 'ava';
import * as fs from 'fs-extra';

import Config from '../../config';
import { ETHEREUM_DEFAULT_CFG } from '../../data';

test.serial('should be able to initialize project config', t => {
  const cfg = Config.init('double-test');

  t.is(cfg.project, 'double-test');
  t.is(cfg.chain, 'ethereum');
  t.true(fs.existsSync('double.yaml'));
});

test.serial('init project config should fail with existing double.yaml', t => {
  fs.writeFileSync('double.yaml', '');
  t.throws(() => {
    Config.init('double-test');
  });
});

test.serial('get config with no double.yaml and nocascade should fail', t => {
  t.throws(() => {
    Config.get(true);
  });
});

test('should be able to load initialized project config', t => {
  const cfg = Config.init('double-test');

  t.is(cfg.project, 'double-test');
  const cfgFromFile = Config.get(true);
  t.deepEqual(cfg, cfgFromFile);
});

test('default config should be valid', t => {
  const cfg = Config.parseFromFile(ETHEREUM_DEFAULT_CFG);

  t.is(cfg.project, 'default');
  t.is(cfg.chain, 'ethereum');
  t.is(cfg.envs.local!.backend, 'geth');
  t.is(cfg.envs.local!.datadir, '~/.double/ethereum');
  t.deepEqual(cfg.envs.local!.hosts, ['127.0.0.1:30303']);
  t.is(cfg.envs.local!.networkID, 999);
});

test.afterEach.always(t => {
  fs.removeSync('double.yaml');
});
