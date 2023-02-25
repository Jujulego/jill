import { BroadcastChannel, getEnvironmentData, setEnvironmentData } from 'node:worker_threads';

import { workerCache } from '@/src/utils/worker-cache';
import { flushPromises } from '@/tools/utils';

// Setup
const KEY = 'jujulego:jill:test-key';
const channel = new BroadcastChannel('jujulego:jill:worker-cache');

beforeEach(() => {
  // Reset environment data
  setEnvironmentData(KEY, undefined as any);

  // Spy on channel
  channel.onmessage = jest.fn();
});

afterAll(() => {
  channel.close();
});

// Tests
describe('workerCache', () => {
  it('should use compute to set value in environment data', async () => {
    const compute = jest.fn(() => 'toto');

    await expect(workerCache(KEY, compute))
      .resolves.toBe('toto');

    expect(compute).toHaveBeenCalled();
    expect(getEnvironmentData(KEY)).toBe('toto');

    await flushPromises();
    expect(channel.onmessage).toHaveBeenCalledWith(expect.objectContaining({
      data: {
        key: KEY,
        value: 'toto',
      }
    }));
  });

  it('should return value from environment data', async () => {
    const compute = jest.fn(() => 'toto');
    setEnvironmentData(KEY, 'toto');

    await expect(workerCache(KEY, compute))
      .resolves.toBe('toto');

    expect(compute).not.toHaveBeenCalled();
    expect(getEnvironmentData(KEY)).toBe('toto');

    await flushPromises();
    expect(channel.onmessage).not.toHaveBeenCalledWith(expect.objectContaining({
      data: {
        key: KEY,
        value: 'toto',
      }
    }));
  });

  it('should save value from channel', async () => {
    channel.postMessage({
      key: KEY,
      value: 'toto',
    });

    await flushPromises();

    expect(getEnvironmentData(KEY)).toBe('toto');
  });
});
