import type { CommandModule } from 'yargs';

export function commandName(module: Pick<CommandModule, 'command'>): string {
  if (!module.command) {
    return '[unknown]';
  }

  if (typeof module.command === 'string') {
    return module.command;
  }

  return module.command[0];
}