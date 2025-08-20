import type { CommandModule } from 'yargs';

export function getCommandName<T, U>(module: CommandModule<T, U>): string {
  if (!module.command) {
    return '[unknown]';
  }

  if (typeof module.command === 'string') {
    return module.command;
  }

  return module.command[0];
}
