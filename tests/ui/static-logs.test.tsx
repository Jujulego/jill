import { render } from 'ink-testing-library';
import winston from 'winston';

import { container, Logger, StaticLogs } from '../../src';

// Setup
let logger: Logger;

beforeEach(() => {
  jest.spyOn(winston.transports.Console.prototype, 'log')
    .mockImplementation();

  logger = container.get(Logger);
});

// Tests
describe('<StaticLogs>', () => {
  it('should replace Console transport', () => {
    // First logs go threw Console transport
    logger.info('should be logged by Console transport');

    expect(winston.transports.Console.prototype.log).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('should be logged by Console transport')
      }),
      expect.any(Function)
    );

    jest.mocked(winston.transports.Console.prototype.log).mockReset();

    // Mount <StaticLogs>
    const { stderr, unmount } = render(<StaticLogs />);
    logger.info('should be logged by <StaticLogs>');

    expect(stderr.lastFrame()).toEqual(expect.stringContaining('should be logged by <StaticLogs>'));
    expect(winston.transports.Console.prototype.log).not.toHaveBeenCalled();

    jest.mocked(winston.transports.Console.prototype.log).mockReset();

    // Unmount <StaticLogs>
    unmount();
    logger.info('should be logged by Console transport again');

    expect(winston.transports.Console.prototype.log).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('should be logged by Console transport again')
      }),
      expect.any(Function)
    );
  });
});
