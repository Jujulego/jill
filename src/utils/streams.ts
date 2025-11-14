import type { Logger, LogLevel } from '@kyrielle/logger';
import assert from 'assert';
import { Writable } from 'node:stream';

export function logStreamedLines(logger: Logger, level: LogLevel): Writable {
  let leftover = '';

  return new Writable({
    write(chunk, _, cb) {
      assert(chunk instanceof Buffer);
      const data = leftover + chunk.toString('utf-8');
      const lines = data.split(/\r?\n/);

      leftover = lines.pop() ?? '';

      for (const line of lines) {
        logger.log(level, line);
      }

      cb();
    },
    final(cb) {
      if (leftover !== '') {
        logger.log(level, leftover);
      }

      cb();
    }
  });
}
