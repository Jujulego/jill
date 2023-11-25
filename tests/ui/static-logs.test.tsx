import { Logger, LogLevel } from '@jujulego/logger';
import { render } from 'ink-testing-library';
import { vi } from 'vitest';

import { LogGateway } from '@/src/commons/logger/log.gateway.js';
import { container } from '@/src/inversify.config.js';
import StaticLogs from '@/src/ui/static-logs.js';

// Setup
let logger: Logger;
let logGateway: LogGateway;

beforeEach(() => {
  container.snapshot();

  logger = container.get(Logger);
  logGateway = container.get(LogGateway);
});

afterEach(() => {
  container.restore();
});


// Tests
describe('<StaticLogs>', () => {
  it('should clear gateway listeners', () => {
    const spy = vi.fn();
    logGateway.subscribe(spy);

    // First logs go threw Console transport
    logger.info('should be logged by Console transport');

    expect(spy).toHaveBeenCalledWith({
      timestamp: expect.any(String),
      level: LogLevel.info,
      message: 'should be logged by Console transport'
    });

    spy.mockClear();

    // Mount <StaticLogs>
    const { stderr, unmount } = render(<StaticLogs />);
    logger.info('should be logged by <StaticLogs>');

    expect(stderr.lastFrame()).toEqual(expect.stringContaining('should be logged by <StaticLogs>'));
    expect(spy).not.toHaveBeenCalled();

    // Unmount <StaticLogs>
    unmount();
    logger.info('should be logged by Console transport again');

    expect(spy).toHaveBeenCalledWith({
      timestamp: expect.any(String),
      level: LogLevel.info,
      message: 'should be logged by Console transport again'
    });
  });
});
