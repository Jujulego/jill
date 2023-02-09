import { BroadcastChannel, getEnvironmentData, type Serializable, setEnvironmentData } from 'node:worker_threads';

import { type Awaitable } from '@/src/types';

// Types
interface CacheUpdate {
  key: Serializable;
  value: Serializable;
}

function isCacheUpdate(msg: unknown): msg is CacheUpdate {
  return typeof msg === 'object' && msg !== null && 'key' in msg && 'value' in msg;
}

// Chanel
const channel = new BroadcastChannel('jujulego:jill:worker-cache');
channel.unref();

channel.onmessage = (msg) => {
  if (isCacheUpdate(msg)) {
    setEnvironmentData(msg.key, msg.value);
  }
};

// Utils
export async function workerCache<R extends Serializable>(key: Serializable, compute: () => Awaitable<R>): Promise<R> {
  const cache = getEnvironmentData(key) as R | undefined;
  if (cache !== undefined) return cache;

  // Compute it
  const result = await compute();

  setEnvironmentData(key, result);
  channel.postMessage({ key, value: result });

  return result;
}
