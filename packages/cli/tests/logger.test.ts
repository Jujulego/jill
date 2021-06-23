import { logger as coreLogger } from '@jujulego/jill-core';

import { mockedOra } from '../mocks/ora';
import { logger } from '../src/logger';

// Setup
jest.mock('@jujulego/jill-core');

beforeEach(() => {
  jest.resetAllMocks();
});

// Test suites
describe('logger.debug', () => {
  // Tests
  it('should call coreLogger.debug', () => {
    logger.debug('test');

    expect(coreLogger.debug).toBeCalledWith('test');
  });
});

describe('logger.verbose', () => {
  // Tests
  it('should call coreLogger.verbose', () => {
    logger.verbose('test');

    expect(coreLogger.verbose).toBeCalledWith('test');
  });
});

describe('logger.info', () => {
  // Tests
  it('should call coreLogger.info', () => {
    logger.info('test');

    expect(coreLogger.info).toBeCalledWith('test');
  });
});

describe('logger.warn', () => {
  // Tests
  it('should call coreLogger.warn', () => {
    logger.warn('test');

    expect(coreLogger.warn).toBeCalledWith('test');
  });
});

describe('logger.error', () => {
  // Tests
  it('should call coreLogger.error', () => {
    logger.error('test');

    expect(coreLogger.error).toBeCalledWith('test');
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
