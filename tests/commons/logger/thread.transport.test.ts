import { type LogEntry } from 'winston';

import { ThreadTransport } from '@/src/commons/logger/thread.transport';

// Setup
let transport: ThreadTransport;

beforeEach(() => {
  transport = new ThreadTransport('jujulego:jill:test-logger');

  jest.spyOn(transport, 'emit');
  jest.spyOn(transport.channel, 'postMessage');
  jest.spyOn(transport.channel, 'close');
});

afterEach(() => {
  transport.close();
});

// Tests
describe('ThreadTransport.log', () => {
  const log: LogEntry = { level: 'test', message: 'toto' };

  it('should pass log entry to channel', () => {
    const next = jest.fn();

    transport.log(log, next);

    expect(transport.channel.postMessage).toHaveBeenCalledWith(log);
    expect(transport.emit).toHaveBeenCalledWith('logged', log);
    expect(next).toHaveBeenCalled();
  });
});

describe('ThreadTransport.close', () => {
  it('should pass log entry to channel', () => {
    const next = jest.fn();

    transport.close(next);

    expect(transport.channel.close).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect(transport.emit).toHaveBeenCalledWith('closed');
  });
});
