import { vi } from 'vitest';
import { type LogEntry } from 'winston';

import { ThreadTransport } from '@/src/commons/logger/thread.transport.js';

// Setup
let transport: ThreadTransport;

beforeEach(() => {
  transport = new ThreadTransport('jujulego:jill:test-logger');


  vi.spyOn(transport, 'emit');
  vi.spyOn(transport.channel, 'postMessage');
  vi.spyOn(transport.channel, 'close');
});

afterEach(() => {
  transport.close();
});

// Tests
describe('ThreadTransport.log', () => {
  const log: LogEntry = { level: 'test', message: 'toto' };

  it('should pass log entry to channel', () => {
    const next = vi.fn();

    transport.log(log, next);

    expect(transport.channel.postMessage).toHaveBeenCalledWith(log);
    expect(transport.emit).toHaveBeenCalledWith('logged', log);
    expect(next).toHaveBeenCalled();
  });
});

describe('ThreadTransport.close', () => {
  it('should pass log entry to channel', () => {
    const next = vi.fn();

    transport.close(next);

    expect(transport.channel.close).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect(transport.emit).toHaveBeenCalledWith('closed');
  });
});
