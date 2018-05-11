import * as os from 'os';

import test from 'ava';

import * as compat from '../../../lib/utils/compat';

test('should be able to untildify path', t => {
  const home = os.homedir();

  t.is(compat.untildify('~'), home);
  t.is(compat.untildify('~/hello'), `${home}/hello`);
  t.is(compat.untildify('~/hello/~/world'), `${home}/hello/~/world`);
});

test('untildify should not modify paths without leading tilde', t => {
  t.is(compat.untildify('/'), '/');
  t.is(compat.untildify('hello'), 'hello');
  t.is(compat.untildify('~hello/~/world'), '~hello/~/world');
});
