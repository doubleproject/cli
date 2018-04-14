import { ConfigParser } from '../../lib/configparser';
import { Validator } from '../../lib/utils/validator';
import test from 'ava';

test('root.yaml should be parseable and valid', async t => {
  const data = ConfigParser.parseFromFile('data/ethereum/root.yaml');
  const valid = new Validator();
  const rootConfig = await valid.validateRootConfig(data);
  t.deepEqual(data, rootConfig);
});

test('local.yaml should be parseable and valid', async t => {
  const data = ConfigParser.parseFromFile('data/ethereum/local.yaml');
  const valid = new Validator();
  const localConfig = await valid.validateLocalConfig(data);
  t.deepEqual(data, localConfig);
});

test('remote.yaml should be parseable and valid', async t => {
  const data = ConfigParser.parseFromFile('data/ethereum/remote.yaml');
  const valid = new Validator();
  const localConfig = await valid.validateLocalConfig(data);
  t.deepEqual(data, localConfig);
});

test('complete local yaml should have root properties', async t => {
  const valid = new Validator();

  const rootdata = ConfigParser.parseFromFile('data/ethereum/root.yaml');
  const rootConfig = await valid.validateRootConfig(rootdata);

  const localdata = ConfigParser.parseFromFile('data/ethereum/local.yaml');
  const localConfig = await valid.validateLocalConfig(localdata);

  if (typeof rootConfig === 'string' ||
      typeof localConfig === 'string') {
    t.fail('Failed to validate root.yaml or local.yaml');
  } else {
    const completeLocalConfig =
      ConfigParser.buildCompleteLocalConfig(rootConfig, localConfig);

    t.is(completeLocalConfig.chain, rootConfig.chain);
    t.is(completeLocalConfig.backend, rootConfig.backend);
    t.deepEqual(completeLocalConfig.accounts, rootConfig.accounts);
    t.deepEqual(completeLocalConfig.hosts, rootConfig.hosts);
  }
});

test('complete remote yaml should have root properties', async t => {
  const valid = new Validator();

  const rootdata = ConfigParser.parseFromFile('data/ethereum/root.yaml');
  const rootConfig = await valid.validateRootConfig(rootdata);

  const remotedata = ConfigParser.parseFromFile('data/ethereum/remote.yaml');
  const remoteConfig = await valid.validateLocalConfig(remotedata);

  if (typeof rootConfig === 'string' ||
      typeof remoteConfig === 'string') {
    t.fail('Failed to validate root.yaml or remote.yaml');
  } else {
    const completeRemoteConfig =
      ConfigParser.buildCompleteRemoteConfig(rootConfig, remoteConfig);

    t.is(completeRemoteConfig.chain, rootConfig.chain);
    t.is(completeRemoteConfig.backend, rootConfig.backend);
    t.deepEqual(completeRemoteConfig.accounts, rootConfig.accounts);
    t.deepEqual(completeRemoteConfig.hosts, rootConfig.hosts);
  }
});
