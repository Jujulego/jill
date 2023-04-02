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

beforeAll(() => {
  container.snapshot();
});

let winstonLogger: winston.Logger;
let logger: Logger;

beforeEach(() => {
  container.restore();
  container.snapshot();

  winstonLogger = {
    level: '',
    log: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    add: jest.fn(),
    remove: jest.fn(),
    child: jest.fn((opts: unknown) => winstonLogger) as winston.Logger['child'],
  } as jest.MaybeMocked<winston.Logger>;

  logger = new Logger(winstonLogger);
});

afterEach(() => {
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

    expect(logger.winston.transports).toHaveLength(1);
    expect(logger.winston.transports[0]).toBeInstanceOf(winston.transports.Console);
  });

  it('should create logger with ThreadTransport outside of main thread', () => {
    Object.assign(wt, { isMainThread: false });

    const logger = container.get(Logger);

    expect(logger.winston.transports).toHaveLength(1);
    expect(logger.winston.transports[0]).toBeInstanceOf(ThreadTransport);
  });
});

describe('Logger.log', () => {
  it('should pass values to winston Logger log method', () => {
    logger.log('test', 'toto');
    
    expect(winstonLogger.log).toHaveBeenCalledWith('test', 'toto');
  });
});

describe('Logger.debug', () => {
  it('should pass message to winston Logger debug method', () => {
    logger.debug('toto');

    expect(winstonLogger.debug).toHaveBeenCalledWith('toto');
  });

  it('should interpret template and pass result to winston', () => {
    logger.debug`test ${42}: life !`;

    expect(winstonLogger.debug).toHaveBeenCalledWith('test 42: life !');
  });
});

describe('Logger.verbose', () => {
  it('should pass message to winston Logger verbose method', () => {
    logger.verbose('toto');

    expect(winstonLogger.verbose).toHaveBeenCalledWith('toto');
  });

  it('should interpret template and pass result to winston', () => {
    logger.verbose`test ${42}: life !`;

    expect(winstonLogger.verbose).toHaveBeenCalledWith('test 42: life !');
  });
});

describe('Logger.info', () => {
  it('should pass message to winston Logger info method', () => {
    logger.info('toto');

    expect(winstonLogger.info).toHaveBeenCalledWith('toto');
  });

  it('should interpret template and pass result to winston', () => {
    logger.info`test ${42}: life !`;

    expect(winstonLogger.info).toHaveBeenCalledWith('test 42: life !');
  });
});

describe('Logger.warn', () => {
  it('should pass message to winston Logger warn method', () => {
    logger.warn('toto');

    expect(winstonLogger.warn).toHaveBeenCalledWith('toto', undefined);
  });

  it('should pass message and cause to winston Logger warn method', () => {
    const cause = new Error();
    logger.warn('toto', cause);

    expect(winstonLogger.warn).toHaveBeenCalledWith('toto', cause);
  });

  it('should interpret template and pass result to winston', () => {
    logger.warn`test ${42}: life !`;

    expect(winstonLogger.warn).toHaveBeenCalledWith('test 42: life !', undefined);
  });
});

describe('Logger.error', () => {
  it('should pass message to winston Logger error method', () => {
    logger.error('toto');

    expect(winstonLogger.error).toHaveBeenCalledWith('toto', undefined);
  });

  it('should pass message and cause to winston Logger error method', () => {
    const cause = new Error();
    logger.error('toto', cause);

    expect(winstonLogger.error).toHaveBeenCalledWith('toto', cause);
  });

  it('should interpret template and pass result to winston', () => {
    logger.error`test ${42}: life !`;

    expect(winstonLogger.error).toHaveBeenCalledWith('test 42: life !', undefined);
  });
});

describe('Logger.child', () => {
  it('should return a new logger instance with a child of winston logger', () => {
    const child = logger.child({ toto: 5 });

    expect(child).toBeInstanceOf(Logger);
    expect(winstonLogger.child).toHaveBeenCalledWith({ toto: 5 });
    expect(child.winston).toBe(jest.mocked(winstonLogger.child).mock.results[0].value);
  });
});

describe('Logger.add', () => {
  it('should return a new logger instance with a child of winston logger', () => {
    const child = logger.child({ toto: 5 });

    expect(child).toBeInstanceOf(Logger);
    expect(winstonLogger.child).toHaveBeenCalledWith({ toto: 5 });
    expect(child.winston).toBe(jest.mocked(winstonLogger.child).mock.results[0].value);
  });
});
