import { var$, waitFor$ } from 'kyrielle';

export function mutex$(): Lock {
  const count$ = var$(0);

  return {
    async acquire() {
      let cnt = count$.defer();

      while (cnt > 0) {
        cnt = await waitFor$(count$);
      }

      count$.mutate(cnt + 1);
    },
    release() {
      const cnt = count$.defer();

      if (cnt > 0) {
        count$.mutate(cnt - 1);
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

// Types
export interface Lock {
  acquire(this: void): Promise<void>;
  release(this: void): void;
}
