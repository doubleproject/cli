import test from 'ava';
import * as fs from 'fs-extra';

import * as eth from '../../../backend/ethereum';

test('should be able to create genesis.json', t => {
  eth.createGenesis('eth-test');
  t.true(fs.existsSync('eth-test/genesis.json'));
});

test('should be able to create genesis.json in nonexistent folder', t => {
  eth.createGenesis('eth-test/folder1/folder2');
  t.true(fs.existsSync('eth-test/folder1/folder2/genesis.json'));
});

test('should be able to create genesis.json with account information', t => {
  fs.ensureDirSync('eth-test/account');
  const account = {key1: 'account1', key2: 'account2'};
  fs.writeFileSync(
    'eth-test/account/accounts.json', JSON.stringify(account), 'utf8',
  );
  eth.createGenesis('eth-test/account');
  const genesis = JSON.parse(
    fs.readFileSync('eth-test/account/genesis.json').toString(),
  );
  t.deepEqual(genesis.alloc, {
    account1: {balance: '10000000000000000000'},
    account2: {balance: '10000000000000000000'},
  });
});

test('create genesis should error out if already exists', t => {
  fs.ensureDirSync('eth-test/folder2');
  fs.writeFileSync('eth-test/folder2/genesis.json', '');
  t.throws(() => {
    eth.createGenesis('eth-test/folder2');
  });
});

test('should be able to create accounts', t => {
  eth.createAccounts('eth-test', undefined, 3);
  t.is(fs.readdirSync('eth-test/keystore').length, 3);
  let json = JSON.parse(fs.readFileSync('eth-test/accounts.json').toString());
  t.deepEqual(Object.keys(json).sort(), ['a1', 'a2', 'a3']);

  eth.createAccounts('eth-test', undefined, 3);
  t.is(fs.readdirSync('eth-test/keystore').length, 6);
  json = JSON.parse(fs.readFileSync('eth-test/accounts.json').toString());
  t.deepEqual(Object.keys(json).sort(), ['a1', 'a2', 'a3', 'a4', 'a5', 'a6']);
});

test('should not be able to clean invalid backend', t => {
  t.throws(() => {
    eth.clean('', 'invalid');
  });
});

test('should not be able to start invalid backend', t => {
  t.throws(() => {
    eth.start('', {
      chain: 'ethereum', backend: 'invalid', datadir: '', hosts: [],
    });
  });
});

test.after.always(t => {
  fs.removeSync('eth-test');
});
