import chalk from 'chalk';
import winston from 'winston';
import wt from 'node:worker_threads';

import { container } from '@/src/inversify.config';
import { consoleFormat, Logger } from '@/src/commons/logger.service';
import { ThreadTransport } from '@/src/commons/logger/thread.transport';

// Setup
chalk.level = 1;

const LEVEL = Symbol.for('level');
const MESSAGE = Symbol.for('message');

beforeEach(() => {
  container.snapshot();
});

afterEach(() => {
  container.restore();

  Object.assign(wt, { isMainThread: true });
});

// Types
interface Result extends Exclude<ReturnType<typeof consoleFormat['transform']>, boolean> {
  [MESSAGE]: string;
}

// Utils
function assertLogType(log: ReturnType<typeof consoleFormat['transform']>): asserts log is Result {
  expect(log).not.toEqual(expect.any(Boolean));
}

// Tests
describe('consoleFormat', () => {
  it('should add grey label in bracket before message', () => {
    const log = consoleFormat.transform({
      [LEVEL]: 'info',
      level: 'info',
      label: 'label',
      message: 'test'
    });

    assertLogType(log);
    // eslint-disable-next-line quotes
    expect(log[MESSAGE]).toMatchInlineSnapshot(`"[90m[label][39m [37mtest[39m"`);
  });

  it('should add label only on first line', () => {
    const log = consoleFormat.transform({
      [LEVEL]: 'info',
      level: 'info',
      label: 'label',
      message: 'test\nmultiline\nlog'
    });

    assertLogType(log);
    expect(log[MESSAGE]).toMatchInlineSnapshot(`
"[90m[label][39m [37mtest[39m
        [37mmultiline[39m
        [37mlog[39m"
`);
  });

  it('should print stack in red', () => {
    const log = consoleFormat.transform({
      [LEVEL]: 'error',
      level: 'error',
      label: 'label',
      message: 'test',
      stack: 'file1\nfile2\nfile3'
    });

    assertLogType(log);
    expect(log[MESSAGE]).toMatchInlineSnapshot(`
"[90m[label][39m [31mfile1[39m
        [31mfile2[39m
        [31mfile3[39m"
`);
  });
});

describe('Logger', () => {
  it('should create logger with Console transport', () => {
    const logger = container.get(Logger);

    expect(logger.transports).toHaveLength(1);
    expect(logger.transports[0]).toBeInstanceOf(winston.transports.Console);
  });

  it('should create logger with ThreadTransport outside of main thread', () => {
    Object.assign(wt, { isMainThread: false });

    const logger = container.get(Logger);

    expect(logger.transports).toHaveLength(1);
    expect(logger.transports[0]).toBeInstanceOf(ThreadTransport);
  });
});
