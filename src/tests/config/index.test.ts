import test from 'ava';
import * as path from 'path';

import Config from '../../config';
import { ETHEREUM_DATADIR } from '../../data';

test('default config should be valid', t => {
  const defaultConfigPath = path.join(ETHEREUM_DATADIR, 'double.yaml');
  const cfg = Config.parseFromFile(defaultConfigPath);

  t.is(cfg.project, 'default');
  t.is(cfg.chain, 'ethereum');
  t.is(cfg.env.local!.backend, 'geth');
  t.is(cfg.env.local!.datadir, '~/.double/datadir');
  t.is(cfg.env.test!.keydir, '~/.double/default/keys');
  t.deepEqual(cfg.env.local!.hosts, ['127.0.0.1:30303']);
  t.is(cfg.env.local!.networkid, 999);
});
