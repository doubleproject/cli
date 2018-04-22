import { ETHEREUM_DATADIR } from '../data';
import * as ethereum from '../backend/ethereum';

import Geth from '../backend/ethereum/geth';

export function cli() {
  const command = Geth.startScript({
    datadir: ETHEREUM_DATADIR,
    identity: 'boson',
    nodiscover: true,
    rpc: true,
  });
  executeSync(command);
}
