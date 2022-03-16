import { logger } from '@jujulego/jill-core';
import { render } from 'ink-testing-library';

import { StaticLogs } from '../../src/components/StaticLogs';

// Setup
logger.level = 'debug';

// Tests
describe('StaticLogs', () => {
  it('should print logs', async () => {
    expect(logger.transports).toHaveLength(0);

    // First render should add transport
    const { lastFrame, rerender, unmount } = render(<StaticLogs />);
    await new Promise(res => setTimeout(res, 0));

    expect(logger.transports).toHaveLength(1);

    // Should print logs
    logger.debug('Test debug log');
    logger.verbose('Test verbose log');
    logger.info('Test info log');
    logger.warn('Test warn log');
    logger.error('Test error log');

    rerender(<StaticLogs />);

    expect(lastFrame()).toMatchSnapshot();

    // Unmount should remove transport
    unmount();
    await new Promise(res => setTimeout(res, 0));

    expect(logger.transports).toHaveLength(0);
  });

  it('should print logs with labels', async () => {
    const { lastFrame, rerender, unmount } = render(<StaticLogs />);
    await new Promise(res => setTimeout(res, 0));

    // Should print logs
    logger.debug('Test debug log', { label: 'test' });
    logger.verbose('Test verbose log', { label: 'test' });
    logger.info('Test info log', { label: 'test' });
    logger.warn('Test warn log', { label: 'test' });
    logger.error('Test error log', { label: 'test' });

    rerender(<StaticLogs />);

    expect(lastFrame()).toMatchSnapshot();

    // Unmount should remove transport
    unmount();
    await new Promise(res => setTimeout(res, 0));
  });
});
