import { source$, waitFor$ } from 'kyrielle';

export function semaphore$(): Lock {
  let count = 0;
  const release = source$<void>();

  return {
    async acquire() {
      while (count > 0) {
        await waitFor$(release);
      }

      count++;

      return {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        [Symbol.dispose]: this.release,
      };
    },
    release() {
      if (count > 0) {
        count--;

        if (count === 0) {
          release.next();
        }
      }
    },
  };
}

export async function with$<R>(lock: Lock, fn: () => R): Promise<Awaited<R>> {
  try {
    await lock.acquire();
    return await fn();
  } finally {
    lock.release();
  }
}

export interface Lock{
  acquire(): Promise<Disposable>;
  release(): void;
}