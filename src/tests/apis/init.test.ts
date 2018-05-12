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

test.after.always(t => {
  fs.removeSync('init-test');
});
