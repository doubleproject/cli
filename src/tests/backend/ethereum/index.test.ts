import test from 'ava';
import * as fs from 'fs-extra';

import * as eth from '../../../backend/ethereum';

test.serial('should be able to create genesis.json', t => {
  eth.createGenesis('.');
  t.true(fs.existsSync('genesis.json'));
});

test('should be able to create genesis.json in nonexistent folder', t => {
  eth.createGenesis('nonexistent/folder');
  t.true(fs.existsSync('nonexistent/folder/genesis.json'));
});

test.serial('create genesis should error out if already exists', t => {
  fs.writeFileSync('genesis.json', '');
  t.throws(() => {
    eth.createGenesis('.');
  });
});

test.afterEach.always(t => {
  fs.removeSync('genesis.json');
  fs.removeSync('nonexistent/folder/genesis.json');
});
