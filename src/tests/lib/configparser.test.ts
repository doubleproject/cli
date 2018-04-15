import { ConfigParser } from '../../lib/config';
import test from 'ava';

test('root.yaml should be parseable and valid', async t => {
  const data = await ConfigParser.parseRootConfigFromFile('testdata/root.yaml');
  if (typeof data === 'string') {
    t.fail(data);
  } else {
    t.pass();
  }
});

test('local.yaml should be parseable and valid', async t => {
  const data = await ConfigParser.parseLocalConfigFromFile('testdata/local.yaml');
  if (typeof data === 'string') {
    t.fail(data);
  } else {
    t.pass();
  }
});

test('remote.yaml should be parseable and valid', async t => {
  const data = await ConfigParser.parseRemoteConfigFromFile('testdata/remote.yaml');
  if (typeof data === 'string') {
    t.fail(data);
  } else {
    t.pass();
  }
});

test('complete local yaml should have root properties', async t => {
  const rootConfig = await ConfigParser.parseRootConfigFromFile('testdata/root.yaml');
  const localConfig = await ConfigParser.parseLocalConfigFromFile('testdata/local.yaml');

  if (typeof rootConfig === 'string' ||
      typeof localConfig === 'string') {
    t.fail('Failed to parse and validate root.yaml or local.yaml');
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
  const rootConfig = await ConfigParser.parseRootConfigFromFile('testdata/root.yaml');

  const remoteConfig = await ConfigParser.parseRemoteConfigFromFile('testdata/remote.yaml');

  if (typeof rootConfig === 'string' ||
      typeof remoteConfig === 'string') {
    t.fail('Failed to parse and validate root.yaml or remote.yaml');
  } else {
    const completeRemoteConfig =
      ConfigParser.buildCompleteRemoteConfig(rootConfig, remoteConfig);

    t.is(completeRemoteConfig.chain, rootConfig.chain);
    t.is(completeRemoteConfig.backend, rootConfig.backend);
    t.deepEqual(completeRemoteConfig.hosts, rootConfig.hosts);
    t.is(completeRemoteConfig.datadir, remoteConfig.datadir);
  }
});
