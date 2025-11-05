import { startSpan } from '@sentry/node';
import { pipe$ } from 'kyrielle';

export function trace<T, A extends unknown[], R>(fun: (this: T, ...args: A) => R, opts: string | InstrumentFunOpts<R>) {
  const name = typeof opts === 'string' ? opts : (opts.name);
  const op = typeof opts === 'object' ? opts.op : undefined;
  const use = (typeof opts === 'object' && opts.use) || ((_: string, r: R) => r);

  return function(this: T, ...args: A) {
    return pipe$(
      startSpan({ name, op }, () => fun.call(this, ...args)),
      (r) => use(name, r),
    );
  };
}

export function instrument<O>(opts?: string | InstrumentOpts<O>) {
  return <T, A extends unknown[], R extends O>(
    target: Method<T, A, R>,
    context: ClassMethodDecoratorContext<T, Method<T, A, R>>
  ) => {
    const name = typeof opts === 'string' ? opts : (opts?.name ?? context.name.toString());
    const use = typeof opts === 'object' ? opts.use : (_: string, r: O) => r;

    return trace(target, { name, use });
  };
}

export function traceAsyncGenerator<T, R, N>(name: string, generator: AsyncGenerator<T, R, N>) {
  const instrumented = {
    ...generator,
    next: async () => startSpan({ name, op: 'iterator.next' }, () => generator.next()),
    [Symbol.asyncIterator]: () => instrumented,
  };

  return instrumented;
}

export function traceImport<M>(name: string, loader: () => Promise<M>): Promise<M> {
  return startSpan({ name: name, op: 'resource.script' }, loader);
}

// Types
type Method<T, A extends unknown[], R> = (this: T, ...args: A) => R;

interface InstrumentOpts<O> {
  name?: string;
  use: (name: string, result: O) => O;
}
interface InstrumentFunOpts<O> {
  name: string;
  op?: string;
  use?: (name: string, result: O) => O;
}
