import * as path from 'path';

const ROOT = path.join(__dirname, '..', 'data');

export const ETHEREUM_DATADIR = path.join(ROOT, 'ethereum');
export const ETHEREUM_GENESIS = path.join(ROOT, 'ethereum', 'genesis.json');
export const ETHEREUM_ROOTCFG = path.join(ROOT, 'ethereum', 'double.yaml');
