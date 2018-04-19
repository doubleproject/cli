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

test('create genesis should error out if already exists', t => {
  fs.ensureDirSync('eth-test/folder2');
  fs.writeFileSync('eth-test/folder2/genesis.json', '');
  t.throws(() => {
    eth.createGenesis('eth-test/folder2');
  });
});

test.after.always(t => {
  fs.removeSync('eth-test');
});
