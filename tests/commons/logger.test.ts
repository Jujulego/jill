import chalk from 'chalk';
import { vi } from 'vitest';
import winston from 'winston';
import wt from 'node:worker_threads';

import { container } from '@/src/inversify.config';
import { Logger } from '@/src/commons/logger.service';
import { ThreadTransport } from '@/src/commons/logger/thread.transport';

// Setup
chalk.level = 1;

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
    log: vi.fn(),
    debug: vi.fn(),
    verbose: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    child: vi.fn((opts: unknown) => winstonLogger) as winston.Logger['child'],
  } as vi.MaybeMocked<winston.Logger>;

  logger = new Logger(winstonLogger);
});

afterEach(() => {
  Object.assign(wt, { isMainThread: true });
});

// Tests
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
    expect(child.winston).toBe(vi.mocked(winstonLogger.child).mock.results[0].value);
  });
});

describe('Logger.add', () => {
  it('should return a new logger instance with a child of winston logger', () => {
    const child = logger.child({ toto: 5 });

    expect(child).toBeInstanceOf(Logger);
    expect(winstonLogger.child).toHaveBeenCalledWith({ toto: 5 });
    expect(child.winston).toBe(vi.mocked(winstonLogger.child).mock.results[0].value);
  });
});
