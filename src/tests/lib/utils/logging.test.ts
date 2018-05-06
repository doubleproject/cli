import test from 'ava';
import chalk from 'chalk';
import * as sinon from 'sinon';

import * as logging from '../../../lib/utils/logging';

test('should be able to log at different levels', t => {
  const silentMode = process.env.SILENT_MODE;
  delete process.env.SILENT_MODE;
  const stub = sinon.stub(console, 'log');

  logging.error('hello');
  t.truthy((console.log as sinon.SinonStub).calledOnceWith(
    chalk.red('ERROR') + ' hello',
  ));

  stub.reset();
  logging.warning('hello');
  t.truthy((console.log as sinon.SinonStub).calledOnceWith(
    chalk.yellow('WARNING') + ' hello',
  ));

  stub.reset();
  logging.info('hello', true);
  t.truthy((console.log as sinon.SinonStub).calledOnceWith(
    chalk.cyan('INFO hello'),
  ));

  stub.reset();
  logging.success('hello', true);
  t.truthy((console.log as sinon.SinonStub).calledOnceWith(
    chalk.green('SUCCESS hello'),
  ));

  process.env.SILENT_MODE = silentMode;
});
