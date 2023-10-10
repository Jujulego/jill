import { BroadcastChannel } from 'node:worker_threads';
import { vi } from 'vitest';

import { ThreadGateway } from '@/src/commons/logger/thread.gateway.js';
import { container } from '@/src/inversify.config.js';
import { LogLevel, quick } from '@jujulego/logger';
import { flushPromises } from '@/tools/utils.js';

// Setup
let channel: BroadcastChannel;
let gateway: ThreadGateway;
const gatewaySpy = vi.fn();

beforeAll(() => {
  container.snapshot();

  channel = new BroadcastChannel('jujulego:jill:logger');
  channel.onmessage = vi.fn();
  channel.onmessageerror = vi.fn();
});

beforeEach(() => {
  container.restore();
  container.snapshot();

  vi.clearAllMocks();

  gateway = container.get(ThreadGateway);
  gateway.subscribe(gatewaySpy);
});

// Tests
describe('ThreadGateway', () => {
  it('should post messages in broadcast channel', async () => {
    const log = { level: LogLevel.info, timestamp: 'today', message: 'toto' };
    gateway.next(log);

    await flushPromises();

    expect(channel.onmessage).toHaveBeenCalledWith(expect.objectContaining({ data: log }));
    expect(gatewaySpy).not.toHaveBeenCalled();
  });

  it('should emit received message', async () => {
    const log = { level: LogLevel.info, timestamp: 'today', message: 'toto' };
    channel.postMessage(log);

    await flushPromises();

    expect(gatewaySpy).toHaveBeenCalledWith(log);
  });

  it('should log message error events', async () => {
    const log = { error: 'invalid payload' };
    gateway.channel.onmessageerror({ data: log });

    await flushPromises();

    expect(gatewaySpy).toHaveBeenCalledWith({
      level: LogLevel.error,
      timestamp: expect.any(String),
      message: quick.string`Unable to read message: #!json:${log}`
    });
  });
});
