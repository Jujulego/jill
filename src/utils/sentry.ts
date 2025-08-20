import { startSpan } from '@sentry/node';
import { type AnyAsyncIterable, asyncIterator$, extractAwaitableIterator, type SimpleAsyncIterator } from 'kyrielle';

export function instrumentAsyncIterator<I>(name: string, iterable: AnyAsyncIterable<I>): SimpleAsyncIterator<I> {
  const iterator = extractAwaitableIterator(iterable);

  return asyncIterator$<I>({
    next: async () => startSpan({ name, op: 'iterator.next' }, () => iterator.next())
  });
}

export function instrument(name?: string) {
  return <T, A extends unknown[], R>(
    target: Method<T, A, R>,
    context: ClassMethodDecoratorContext<T, Method<T, A, R>>
  ) => {
    return function(this: T, ...args: A) {
      return startSpan({ name: name ?? context.name.toString() }, () => target.call(this, ...args));
    };
  };
}

// Types
type Method<T, A extends unknown[], R> = (this: T, ...args: A) => R;