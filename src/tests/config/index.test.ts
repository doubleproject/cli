import * as fs from 'fs';
import * as path from 'path';

import test from 'ava';

import Config from '../../config';
import { ETHEREUM_DATADIR } from '../../data';

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

test.serial('should be able to load initialized project config', t => {
  const cfg = Config.init('double-test');

  t.is(cfg.project, 'double-test');
  const cfgFromFile = Config.get(true);
  t.deepEqual(cfg, cfgFromFile);
});

test('default config should be valid', t => {
  const defaultConfigPath = path.join(ETHEREUM_DATADIR, 'double.yaml');
  const cfg = Config.parseFromFile(defaultConfigPath);

  t.is(cfg.project, 'default');
  t.is(cfg.chain, 'ethereum');
  t.is(cfg.env.local!.backend, 'geth');
  t.is(cfg.env.local!.datadir, '~/.double/datadir');
  t.is(cfg.env.test!.keydir, '~/.double/default/keys');
  t.deepEqual(cfg.env.local!.hosts, ['127.0.0.1:30303']);
  t.is(cfg.env.local!.networkid, 999);
});

test.afterEach.always(t => {
  if (fs.existsSync('double.yaml')) {
    fs.unlinkSync('double.yaml');
  }
});
