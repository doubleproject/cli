import test from 'ava';
import { Validator } from '../../../lib/utils/validator';

test('root config must have chain and hosts', async t => {
  const config = {
    chain: 'mytestchain',
    hosts: ['127.0.0.1:8080', '127.0.0.1:8081']
  };
  
  var validator = new Validator();
  const result = await validator.validateRootConfig(config);
  if (typeof result === 'string') {
    console.log(result);
  } else {
    const cfg = result;
    t.is(cfg.chain, config.chain);
    t.deepEqual(cfg.hosts, config.hosts);
  }
});


test('validator should report missing hosts', async t => {
  const config = {
    chain: 'mytestchain',
  };
  
  var validator = new Validator();
  const result = await validator.validateRootConfig(config);
  if (typeof result === 'string') {
    t.pass(result);
  } else {
    t.fail('Validator should report missing host property on root config');
  }
});

test('validator should report empty hosts', async t => {
  const config = {
    chain: 'mytestchain',
    hosts: []
  };
  
  var validator = new Validator();
  const result = await validator.validateRootConfig(config);
  if (typeof result === 'string') {
    t.pass(result);
  } else {
    t.fail('Validator should report empty host property on root config');
  }
});
