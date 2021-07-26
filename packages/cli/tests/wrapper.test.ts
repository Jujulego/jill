import { Project } from '@jujulego/jill-core';

import { logger } from '../src/logger';
import { commandHandler } from '../src/wrapper';

// Setup
jest.mock('@jujulego/jill-core');

beforeEach(() => {
  jest.restoreAllMocks();

  jest.spyOn(process, 'exit')
    .mockImplementation();
});

// Test suite
describe('commandHandler', () => {
  // Tests
  it('should call handler with project form cli options', async () => {
    const handler = jest.fn();

    await expect(commandHandler(handler)({ project: '/test' }))
      .resolves.toBeUndefined();

    // Checks
    expect(Project).toHaveBeenCalledWith('/test');
    expect(handler).toHaveBeenCalledWith(expect.any(Project), { project: '/test' });
  });

  it('should set verbosity level to "verbose"', async () => {
    const handler = jest.fn();

    await expect(commandHandler(handler)({ project: '.', verbose: 1 }))
      .resolves.toBeUndefined();

    // Checks
    expect(logger.level).toBe('verbose');
    expect(handler).toHaveBeenCalledWith(expect.any(Project), { project: '.', verbose: 1 });
  });

  it('should set verbosity level to "debug"', async () => {
    const handler = jest.fn();

    await expect(commandHandler(handler)({ project: '.', verbose: 2 }))
      .resolves.toBeUndefined();

    // Checks
    expect(logger.level).toBe('debug');
    expect(handler).toHaveBeenCalledWith(expect.any(Project), { project: '.', verbose: 2 });
  });

  it('should log failure', async () => {
    jest.spyOn(logger, 'fail');

    const error = new Error('error');
    const handler = jest.fn()
      .mockRejectedValue(error);

    // Call
    await expect(commandHandler(handler)({ project: '.' }))
      .resolves.toBeUndefined();

    // Checks
    expect(handler).toHaveBeenCalledWith(expect.any(Project), { project: '.' });
    expect(logger.fail).toHaveBeenCalledWith(error);
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
