import chalk from 'chalk';

import { mockedOra } from '../mocks/ora';

import { logger, OraTransport } from '../src/logger';

// Setup
chalk.level = 1;

const defaultLevel = logger.level;
const MESSAGE = Symbol.for('message');

beforeEach(() => {
  jest.restoreAllMocks();

  // Mocks
  jest.spyOn(process.stderr, 'write')
    .mockImplementation(() => true);
});

// Test suites
describe('logger', () => {
  beforeEach(() => {
    logger.level = defaultLevel;
    jest.spyOn(OraTransport.prototype, 'log');
  });

  describe('logger.debug', () => {
    // Tests
    it('should not call OraTransport.log (by default)', () => {
      logger.debug('test');

      // Checks
      expect(OraTransport.prototype.log).not.toHaveBeenCalled();
    });

    it('should call OraTransport.log', () => {
      logger.level = 'debug';
      logger.debug('test');

      // Checks
      expect(OraTransport.prototype.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'debug',
          message: chalk`{grey test}`
        }),
        expect.anything()
      );
    });
  });

  describe('logger.verbose', () => {
    // Tests
    it('should not call OraTransport.log (by default)', () => {
      logger.verbose('test');

      // Checks
      expect(OraTransport.prototype.log).not.toHaveBeenCalled();
    });

    it('should call OraTransport.log', () => {
      logger.level = 'verbose';
      logger.verbose('test');

      // Checks
      expect(OraTransport.prototype.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'verbose',
          message: chalk`{blue test}`
        }),
        expect.anything()
      );
    });
  });

  describe('logger.info', () => {
    // Tests
    it('should call coreLogger.info', () => {
      logger.info('test');

      // Checks
      expect(OraTransport.prototype.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          message: chalk`{white test}`
        }),
        expect.anything()
      );
    });
  });

  describe('logger.warn', () => {
    // Tests
    it('should call coreLogger.warn', () => {
      logger.warn('test');

      // Checks
      expect(OraTransport.prototype.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'warn',
          message: chalk`{yellow test}`
        }),
        expect.anything()
      );
    });
  });

  describe('logger.error', () => {
    // Tests
    it('should call coreLogger.error', () => {
      logger.error('test');

      // Checks
      expect(OraTransport.prototype.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'error',
          message: chalk`{red test}`
        }),
        expect.anything()
      );
    });
  });

  describe('logger.spin', () => {
    // Test
    it('should call ora start', () => {
      jest.spyOn(mockedOra, 'start');

      logger.spin('test');

      expect(mockedOra.start).toHaveBeenCalledWith('test');
    });
  });

  describe('logger.succeed', () => {
    // Test
    it('should call ora start', () => {
      jest.spyOn(mockedOra, 'succeed');

      logger.succeed('test');

      expect(mockedOra.succeed).toHaveBeenCalledWith('test');
    });
  });

  describe('logger.fail', () => {
    // Test
    it('should call ora start', () => {
      jest.spyOn(mockedOra, 'fail');

      logger.fail('test');

      expect(mockedOra.fail).toHaveBeenCalledWith('test');
    });
  });

  describe('logger.stop', () => {
    // Test
    it('should call ora start', () => {
      jest.spyOn(mockedOra, 'stop');

      logger.stop();

      expect(mockedOra.stop).toHaveBeenCalledWith();
    });
  });
});

describe('OraTransport', () => {
  let transport: OraTransport;

  beforeEach(() => {
    transport = new OraTransport();
  });

  // Tests
  describe('OraTransport.log', () => {
    it('should print message to stderr', () => {
      transport.log({ [MESSAGE]: 'test' }, () => undefined);

      // Checks
      expect(process.stderr.write).toHaveBeenCalledWith('test\n');
    });

    it('should keep ora spinning', () => {
      mockedOra.isSpinning = true;
      mockedOra.text = 'testing ...';
      jest.spyOn(mockedOra, 'start');

      transport.log({ [MESSAGE]: 'test' }, () => undefined);

      // Checks
      expect(process.stderr.write).toHaveBeenCalledWith('test\n');

      expect(mockedOra.isSpinning).toBe(true);
      expect(mockedOra.text).toBe('testing ...');
    });
  });
});
