import { ConfigParser } from '../../lib/config';
import { Validator } from '../../lib/utils/validator';
import test from 'ava';

test('root.yaml should be parseable and valid', async t => {
  const data = ConfigParser.parseFromFile('testdata/root.yaml');
  const valid = new Validator();
  const rootConfig = await valid.validateRootConfig(data);
  t.deepEqual(data, rootConfig);
});

test('local.yaml should be parseable and valid', async t => {
  const data = ConfigParser.parseFromFile('testdata/local.yaml');
  const valid = new Validator();
  const localConfig = await valid.validateLocalConfig(data);
  t.deepEqual(data, localConfig);
});

test('remote.yaml should be parseable and valid', async t => {
  const data = ConfigParser.parseFromFile('testdata/remote.yaml');
  const valid = new Validator();
  const remoteConfig = await valid.validateRemoteConfig(data);
  t.deepEqual(data, remoteConfig);
});

test('complete local yaml should have root properties', async t => {
  const valid = new Validator();

  const rootdata = ConfigParser.parseFromFile('testdata/root.yaml');
  const rootConfig = await valid.validateRootConfig(rootdata);

  const localdata = ConfigParser.parseFromFile('testdata/local.yaml');
  const localConfig = await valid.validateLocalConfig(localdata);

  if (typeof rootConfig === 'string' ||
      typeof localConfig === 'string') {
    t.fail('Failed to validate root.yaml or local.yaml');
  } else {
    const completeLocalConfig =
      ConfigParser.buildCompleteLocalConfig(rootConfig, localConfig);

    t.is(completeLocalConfig.chain, rootConfig.chain);
    t.is(completeLocalConfig.backend, rootConfig.backend);
    t.deepEqual(completeLocalConfig.hosts, rootConfig.hosts);
    t.is(completeLocalConfig.datadir, localConfig.datadir);
  }
});

test('complete remote yaml should have root properties', async t => {
  const valid = new Validator();

  const rootdata = ConfigParser.parseFromFile('testdata/root.yaml');
  const rootConfig = await valid.validateRootConfig(rootdata);

  const remotedata = ConfigParser.parseFromFile('testdata/remote.yaml');
  const remoteConfig = await valid.validateRemoteConfig(remotedata);

  if (typeof rootConfig === 'string' ||
      typeof remoteConfig === 'string') {
    t.fail('Failed to validate root.yaml or remote.yaml');
  } else {
    const completeRemoteConfig =
      ConfigParser.buildCompleteRemoteConfig(rootConfig, remoteConfig);

    t.is(completeRemoteConfig.chain, rootConfig.chain);
    t.is(completeRemoteConfig.backend, rootConfig.backend);
    t.deepEqual(completeRemoteConfig.hosts, rootConfig.hosts);
    t.is(completeRemoteConfig.datadir, remoteConfig.datadir);
  }
});
