import { ConfigParser } from '../../lib/config';
import { ETHEREUM_DATADIR } from '../../data';
import test from 'ava';
import * as path from 'path';

test('default config should be valid', async t => {
  const defaultConfigPath = path.join(ETHEREUM_DATADIR, 'boson.yaml');
  const envConfig = await ConfigParser.parseProjConfigFromFile(defaultConfigPath);

  if (typeof envConfig === 'string') {
    t.fail(envConfig);
  } else {
    t.is(envConfig.project, 'default');
    t.is(envConfig.chain, 'ethereum');
    t.is(envConfig.local!.backend, 'geth');
    t.is(envConfig.local!.datadir, '~/.boson/datadir');
    t.is(envConfig.test!.keydir, '~/.boson/default/keys');
    t.deepEqual(envConfig.local!.hosts, ['127.0.0.1:30303']);
    t.is(envConfig.local!.networkid, 999);
  }
});
