import test from 'ava';
import * as inquirer from 'inquirer';
import * as sinon from 'sinon';

import * as start from '../../apis/start';
import * as ethereum from '../../backend/ethereum';
import Config from '../../config';

test('should not be able to start invalid environment', t => {
  t.throws(() => {
    start.cli('invalid');
  });
});

test('should not be able to start remote environment', t => {
  t.throws(() => {
    const cfg = Config.parseFromFile('data/tests/multi.yaml');
    start.startForConfig(cfg, 'remote');
  });
});

test('should fail for config without local environment', t => {
  t.throws(() => {
    const cfg = Config.parseFromFile('data/tests/remote.yaml');
    start.startForConfig(cfg);
  });
});

test('should prompt user to choose from multiple environments', t => {
  const cfg = Config.parseFromFile('data/tests/multi.yaml');
  sinon.stub(ethereum, 'start');
  sinon.stub(inquirer, 'prompt').resolves({env: 'local1'});
  start.startForConfig(cfg);
  t.truthy((inquirer.prompt as sinon.SinonStub).calledWithMatch([{
    type: 'list',
    name: 'env',
    message: 'Select the local environment to start:',
    choices: ['local1', 'local2', 'local3'],
  }]));
});

test('should not be able to start invalid chain', t => {
  t.throws(() => {
    start.startSingle('invalid-proj', 'invalid', {
      chain: 'invalid',
      datadir: '',
      host: {
        host: '',
        port: 0,
      },
    });
  });
});
