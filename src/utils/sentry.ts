import { getActiveSpan, getRootSpan, startSpan, updateSpanName } from '@sentry/node';
import { type AnyAsyncIterable, asyncIterator$, extractAwaitableIterator, type SimpleAsyncIterator } from 'kyrielle';
import type { CommandModule } from 'yargs';
import { getCommandName } from './yargs.js';

export function instrumentCommand<T, U>(module: CommandModule<T, U>): CommandModule<T, U> {
  const command = getCommandName(module);

  return {
    ...module,
    async handler(args) {
      const activeSpan = getActiveSpan();

      if (activeSpan) {
        updateSpanName(getRootSpan(activeSpan), `jill ${command}`);
      }

      await startSpan({ name: command, op: 'cli.handler' }, () => module.handler(args));
    }
  };
}

export function instrumentAsyncIterator<I>(name: string, iterable: AnyAsyncIterable<I>): SimpleAsyncIterator<I> {
  const iterator = extractAwaitableIterator(iterable);

  return asyncIterator$<I>({
    next: async () => startSpan({ name, op: 'iterator.next' }, () => iterator.next())
  });
}
