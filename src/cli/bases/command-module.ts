import { getActiveSpan, getRootSpan, updateSpanName } from '@sentry/node';
import type { Argv, CommandModule } from 'yargs';
import { trace } from '../../utils/sentry.js';

export function command<T, U>(module: CommandModule<T, U>) {
  const name = getCommandName(module);
  const handler = trace(module.handler, 'cli.handler');

  return <V extends T>(parser: Argv<V>) => parser.command({
    ...module,
    async handler(args) {
      const activeSpan = getActiveSpan();

      if (activeSpan) {
        updateSpanName(getRootSpan(activeSpan), `jill ${name}`);
      }

      await handler(args);
    }
  });
}

function getCommandName<T, U>(module: CommandModule<T, U>): string {
  if (!module.command) {
    return '[unknown]';
  }

  if (typeof module.command === 'string') {
    return module.command;
  }

  return module.command[0];
}
