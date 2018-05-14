import test from 'ava';
import * as fs from 'fs-extra';

import Config from '../../config';
import { INodeConfig } from '../../config/schema';
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

test.serial('should be able to get env config', t => {
  const cfg = Config.getForEnv('local');
  t.is(cfg.datadir, '~/.double/ethereum');
});

test('get env config with invalid env should fail', t => {
  t.throws(() => {
    Config.getForEnv('invalid');
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
  t.deepEqual(cfg.envs.local!.host, {host: '127.0.0.1', port: 30303});
  t.is(cfg.envs.local!.networkID, 999);
});

test('default test config should be valid', t => {
  const cfg = Config.parseFromFile('data/tests/default.yaml');

  t.is(cfg.project, 'config-test');
  t.is(cfg.chain, 'ethereum');
  t.is(cfg.envs.local!.backend, 'geth');
  t.is(cfg.envs.local!.datadir, '~/.double/ethereum');
  t.deepEqual(cfg.envs.local!.host as INodeConfig, {host: '127.0.0.1', port: 30304, rpcPort: 8546});
  t.is(cfg.envs.local!.networkID, 999);
});

test.afterEach.always(t => {
  fs.removeSync('double.yaml');
});

test('should be able to prune config', t => {
  const cfg = Config.parseFromFile(ETHEREUM_DEFAULT_CFG);
  cfg.envs.local.chain = 'ethereum';
  cfg.envs.local.backend = 'geth';
  Config.prune(cfg);
  t.falsy(cfg.envs.local.chain);
  t.falsy(cfg.envs.local.backend);

  cfg.envs.local.chain = 'chain';
  cfg.envs.local.backend = 'backend';
  Config.prune(cfg);
  t.is(cfg.envs.local.chain, 'chain');
  t.is(cfg.envs.local.backend, 'backend');
});
