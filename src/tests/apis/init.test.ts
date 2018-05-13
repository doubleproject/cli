import test from 'ava';
import * as fs from 'fs-extra';
import * as sinon from 'sinon';

import * as backend from '../../backend';

import rewire = require('rewire');
const init = rewire('../../apis/init');

test('should be able to create accounts', t => {
  const task = init.__get__('createAccountTask')('local', {
    chain: 'ethereum', datadir: 'init-test/account', hosts: [],
  });
  t.is(task.skip(), undefined);
  sinon.stub(backend, 'createAccounts');
  task.task(null, {title: ''});
  t.truthy((backend.createAccounts as sinon.SinonStub).calledWithMatch(
    'ethereum', 'init-test/account',
  ));
});

test('should skip account creation if already exists', t => {
  fs.ensureFileSync('init-test/account-existing/accounts.json');
  const task = init.__get__('createAccountTask')('local', {
    datadir: 'init-test/account-existing', hosts: [],
  });
  t.truthy(task.skip());
});

test('should skip genesis creation if already exists', t => {
  const task = init.__get__('createGenesisTask')('local', {
    chain: 'ethereum',
    datadir: 'init-test/genesis-existing',
    hosts: [],
    local: true,
  });
  t.is(task.skip(), undefined);

  const listr = task.task();
  fs.ensureFileSync('init-test/genesis-existing/genesis.json');
  t.truthy(listr._tasks[0].skip());
});

test('should be able to create genesis config', t => {
  const task = init.__get__('createGenesisTask')('local', {
    chain: 'ethereum', datadir: 'init-test/genesis', hosts: [], local: true,
  });

  const listr = task.task();
  t.is(listr._tasks[0].skip(), undefined);
  sinon.stub(backend, 'createGenesis');
  listr._tasks[0].task(undefined, {title: ''});
  t.truthy((backend.createGenesis as sinon.SinonStub).calledWithMatch(
    'ethereum', 'init-test/genesis',
  ));
});

test('should be able to initialize genesis block', t => {
  const task = init.__get__('createGenesisTask')('local', {
    chain: 'ethereum',
    datadir: 'init-test/genesis',
    hosts: [],
    local: true,
    backend: 'geth',
  });

  const listr = task.task();
  sinon.stub(backend, 'init');
  listr._tasks[1].task(undefined, {title: ''});
  t.truthy((backend.init as sinon.SinonStub).calledWithMatch(
    'ethereum', 'init-test/genesis', 'geth',
  ));
});

test('should skip genesis creation if remote', t => {
  const task = init.__get__('createGenesisTask')('remote', {
    chain: 'ethereum', datadir: 'init-test/account', hosts: [],
  });
  t.truthy(task.skip());
});

test('should be able to build env setup task', t => {
  const task = init.__get__('envSetupTask')('local', {
    chain: 'ethereum', datadir: 'init-test/na', hosts: [], local: true,
  });
  t.truthy(task.task());
});

test.after.always(t => {
  fs.removeSync('init-test');
});
