import { render } from 'ink-testing-library';
import { vi } from 'vitest';
import winston from 'winston';

import { container } from '@/src/inversify.config.js';
import { Logger } from '@/src/commons/logger.service.js';
import StaticLogs from '@/src/ui/static-logs.js';

// Setup
let logger: Logger;

beforeEach(() => {
  vi.spyOn(winston.transports.Console.prototype, 'log')
    .mockReturnValue(undefined);

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

    vi.mocked(winston.transports.Console.prototype.log).mockReset();

    // Mount <StaticLogs>
    const { stderr, unmount } = render(<StaticLogs />);
    logger.info('should be logged by <StaticLogs>');

    expect(stderr.lastFrame()).toEqual(expect.stringContaining('should be logged by <StaticLogs>'));
    expect(winston.transports.Console.prototype.log).not.toHaveBeenCalled();

    vi.mocked(winston.transports.Console.prototype.log).mockReset();

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
