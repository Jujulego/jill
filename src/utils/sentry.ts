import { startSpan } from '@sentry/node';
import { type AnyAsyncIterable, asyncIterator$, extractAwaitableIterator, type SimpleAsyncIterator } from 'kyrielle';

export function instrumentAsyncIterator<I>(name: string, iterable: AnyAsyncIterable<I>): SimpleAsyncIterator<I> {
  const iterator = extractAwaitableIterator(iterable);

  return asyncIterator$<I>({
    next: async () => startSpan({ name, op: 'iterator.next' }, () => iterator.next())
  });
}
