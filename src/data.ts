import * as path from 'path';

const ROOT = path.join(__dirname, '..', 'data');

export const ETHEREUM_DATADIR = path.join(ROOT, 'ethereum');
export const ETHEREUM_GENESIS = path.join(ROOT, 'ethereum', 'genesis.json');
export const ETHEREUM_PROJECT_GENESIS =
  path.join(ROOT, 'ethereum', 'project-genesis.json');
export const ETHEREUM_DEFAULT_CFG = path.join(ROOT, 'ethereum', 'default.yaml');
export const ETHEREUM_BASE_CFG = path.join(ROOT, 'ethereum', 'project.yaml');
