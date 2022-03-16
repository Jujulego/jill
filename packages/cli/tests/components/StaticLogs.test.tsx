import { logger } from '@jujulego/jill-core';
import chalk from 'chalk';
import { render } from 'ink-testing-library';

import { StaticLogs } from '../../src/components/StaticLogs';

// Setup
chalk.level = 1;
logger.level = 'debug';

// Tests
describe('StaticLogs', () => {
  it('should register new transport on logger', async () => {
    expect(logger.transports).toHaveLength(0);

    // First render should add transport
    const { unmount } = render(<StaticLogs />);
    await new Promise(res => setTimeout(res, 0));

    expect(logger.transports).toHaveLength(1);

    // Unmount should remove transport
    unmount();
    await new Promise(res => setTimeout(res, 0));

    expect(logger.transports).toHaveLength(0);
  });

  it('should print logs without labels', async () => {
    const { lastFrame, rerender } = render(<StaticLogs />);
    await new Promise(res => setTimeout(res, 0));

    // Should print logs
    logger.debug('Test debug log');
    logger.verbose('Test verbose log');
    logger.info('Test info log');
    logger.warn('Test warn log');
    logger.error('Test error log');

    rerender(<StaticLogs />);

    expect(lastFrame()).toBe(
      chalk`{grey jill: }{grey Test debug log}\n` +
      chalk`{grey jill: }{blue Test verbose log}\n` +
      chalk`{grey jill: }{white Test info log}\n` +
      chalk`{grey jill: }{yellow Test warn log}\n` +
      chalk`{grey jill: }{red Test error log}\n`
    );
  });

  it('should print logs with labels', async () => {
    const { lastFrame, rerender } = render(<StaticLogs />);
    await new Promise(res => setTimeout(res, 0));

    // Should print logs
    logger.debug('Test debug log', { label: 'test' });
    logger.verbose('Test verbose log', { label: 'test' });
    logger.info('Test info log', { label: 'test' });
    logger.warn('Test warn log', { label: 'test' });
    logger.error('Test error log', { label: 'test' });

    rerender(<StaticLogs />);

    expect(lastFrame()).toBe(
      chalk`{grey jill: [test] }{grey Test debug log}\n` +
      chalk`{grey jill: [test] }{blue Test verbose log}\n` +
      chalk`{grey jill: [test] }{white Test info log}\n` +
      chalk`{grey jill: [test] }{yellow Test warn log}\n` +
      chalk`{grey jill: [test] }{red Test error log}\n`
    );
  });
});
