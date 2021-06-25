import chalk from 'chalk';

import { mockedOra } from '../mocks/ora';
import { logger, OraTransport } from '../src/logger';

// Setup
const defaultLevel = logger.level;

beforeEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();

  // Mocks
  jest.spyOn(process.stderr, 'write')
    .mockImplementation(() => true);

  jest.spyOn(OraTransport.prototype, 'log');

  logger.level = defaultLevel;
});

// Test suites
describe('logger.debug', () => {
  // Tests
  it('should not call OraTransport.log (by default)', () => {
    logger.debug('test');

    // Checks
    expect(OraTransport.prototype.log).not.toBeCalled();
  });

  it('should call OraTransport.log', () => {
    logger.level = 'debug';
    logger.debug('test');

    // Checks
    expect(OraTransport.prototype.log).toBeCalledWith(
      expect.objectContaining({
        level: 'debug',
        message: chalk`{grey test}`
      }),
      expect.anything()
    );
    expect(process.stderr.write).toBeCalledWith(chalk`{grey test}\n`);
  });
});

describe('logger.verbose', () => {
  // Tests
  it('should not call OraTransport.log (by default)', () => {
    logger.verbose('test');

    // Checks
    expect(OraTransport.prototype.log).not.toBeCalled();
  });

  it('should call OraTransport.log', () => {
    logger.level = 'verbose';
    logger.verbose('test');

    // Checks
    expect(OraTransport.prototype.log).toBeCalledWith(
      expect.objectContaining({
        level: 'verbose',
        message: chalk`{blue test}`
      }),
      expect.anything()
    );
    expect(process.stderr.write).toBeCalledWith(chalk`{blue test}\n`);
  });
});

describe('logger.info', () => {
  // Tests
  it('should call coreLogger.info', () => {
    logger.info('test');

    // Checks
    expect(OraTransport.prototype.log).toBeCalledWith(
      expect.objectContaining({
        level: 'info',
        message: chalk`{white test}`
      }),
      expect.anything()
    );
    expect(process.stderr.write).toBeCalledWith(chalk`{white test}\n`);
  });
});

describe('logger.warn', () => {
  // Tests
  it('should call coreLogger.warn', () => {
    logger.warn('test');

    // Checks
    expect(OraTransport.prototype.log).toBeCalledWith(
      expect.objectContaining({
        level: 'warn',
        message: chalk`{yellow test}`
      }),
      expect.anything()
    );
    expect(process.stderr.write).toBeCalledWith(chalk`{yellow test}\n`);
  });
});

describe('logger.error', () => {
  // Tests
  it('should call coreLogger.error', () => {
    logger.error('test');

    // Checks
    expect(OraTransport.prototype.log).toBeCalledWith(
      expect.objectContaining({
        level: 'error',
        message: chalk`{red test}`
      }),
      expect.anything()
    );
    expect(process.stderr.write).toBeCalledWith(chalk`{red test}\n`);
  });
});

describe('logger.spin', () => {
  // Test
  it('should call ora start', () => {
    jest.spyOn(mockedOra, 'start');

    logger.spin('test');

    expect(mockedOra.start).toBeCalledWith('test');
  });
});

describe('logger.succeed', () => {
  // Test
  it('should call ora start', () => {
    jest.spyOn(mockedOra, 'succeed');

    logger.succeed('test');

    expect(mockedOra.succeed).toBeCalledWith('test');
  });
});

describe('logger.fail', () => {
  // Test
  it('should call ora start', () => {
    jest.spyOn(mockedOra, 'fail');

    logger.fail('test');

    expect(mockedOra.fail).toBeCalledWith('test');
  });
});

describe('logger.stop', () => {
  // Test
  it('should call ora start', () => {
    jest.spyOn(mockedOra, 'stop');

    logger.stop();

    expect(mockedOra.stop).toBeCalledWith();
  });
});
