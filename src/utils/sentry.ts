import { startSpan, updateSpanName } from '@sentry/node';
import { pipe$ } from 'kyrielle';
import type { InkedComponent } from '../cli/inked.js';

export function instrument<O>(opts?: string | InstrumentOpts<O>) {
  return <T, A extends unknown[], R extends O>(
    target: Method<T, A, R>,
    context: ClassMethodDecoratorContext<T, Method<T, A, R>>
  ) => {
    const name = typeof opts === 'string' ? opts : (opts?.name ?? context.name.toString());
    const use = typeof opts === 'object' ? opts.use : (_: string, r: O) => r;

    return function(this: T, ...args: A) {
      return pipe$(
        startSpan({ name }, () => target.call(this, ...args)),
        (r) => use(name, r),
      );
    };
  };
}

export function asyncGenerator<T, R, N>(name: string, generator: AsyncGenerator<T, R, N>) {
  const instrumented = {
    ...generator,
    next: async () => startSpan({ name, op: 'iterator.next' }, () => generator.next()),
    [Symbol.asyncIterator]: () => instrumented,
  };

  return instrumented;
}

export function instrumentLoad<M>(name: string, loader: () => Promise<M>): Promise<M> {
  return startSpan({ name: `load ${name}`, op: 'import' }, loader);
}

// Types
type Method<T, A extends unknown[], R> = (this: T, ...args: A) => R;

interface InstrumentOpts<O> {
  name?: string;
  use: (name: string, result: O) => O;
}