import { getActiveSpan, getRootSpan, startSpan, updateSpanName } from '@sentry/node';
import type { Argv, CommandModule } from 'yargs';

export function command<T, U>(module: CommandModule<T, U>) {
  const name = getCommandName(module);

  return <V extends T>(parser: Argv<V>) => parser.command({
    ...module,
    async handler(args) {
      const activeSpan = getActiveSpan();

      if (activeSpan) {
        updateSpanName(getRootSpan(activeSpan), `jill ${name}`);
      }

      await startSpan({ name, op: 'cli.handler' }, () => module.handler(args));
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
