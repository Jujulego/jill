import { getActiveSpan, getRootSpan, startSpan, updateSpanName } from '@sentry/node';
import { type AnyAsyncIterable, asyncIterator$, extractAwaitableIterator, type SimpleAsyncIterator } from 'kyrielle';
import type { CommandModule } from 'yargs';

export function instrumentCommand<T, U>(module: CommandModule<T, U>): CommandModule<T, U> {
  const command = getCommandName(module);

  return {
    ...module,
    async handler(args) {
      updateSpanName(getRootSpan(getActiveSpan()!), `jill ${command}`);
      await startSpan({ name: command, op: 'cli.handler' }, async () => module.handler(args));
    }
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCommandName(module: CommandModule<any, any>): string {
  if (!module.command) {
    return '[unknown]';
  }

  if (typeof module.command === 'string') {
    return module.command;
  }

  return module.command[0];
}

export function instrumentAsyncIterator<I>(name: string, iterable: AnyAsyncIterable<I>): SimpleAsyncIterator<I> {
  const iterator = extractAwaitableIterator(iterable);

  return asyncIterator$<I>({
    next: () => startSpan({ name, op: 'iterator.next' }, async () => await iterator.next())
  });
}
