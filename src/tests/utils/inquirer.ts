import { spawn } from 'child_process';
import * as path from 'path';
import { Stream } from 'stream';

export default function(args: string[], combo: string[]) {
  args.unshift(path.join(__dirname, '..', '..', 'cli.js'));
  const proc = spawn('node', args, { stdio: [null, null, null] });
  const loop = (c: string[]) => {
    if (c.length > 0) {
      setTimeout(() => {
        proc.stdin.write(c[0]);
        loop(c.slice(1));
      }, 100);
    } else {
      proc.stdin.end();
    }
  };

  loop(combo);

  return new Promise(resolve => {
    const concat = require('concat-stream');
    proc.stdout.pipe(concat((result: Stream) => {
      resolve(result.toString());
    }));
  });
}
