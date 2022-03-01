import { FC } from 'react';

import { Command, CommandComponent, useArgs, UseArgsHook } from './application.context';

// Types
export type CommandMetadata<A> = Omit<Command<A>, 'id'>

export interface CommandUtils<A> {
  useArgs: UseArgsHook<A>;
  wrapper: (Component: FC) => CommandComponent<A>;
}

// Generate HOC & Hook for command components
export function command<A>(command: CommandMetadata<A>): CommandUtils<A> {
  return {
    useArgs: () => useArgs<A>(),
    wrapper: (Component: FC): CommandComponent<A> => {
      Component.displayName = `command(${Component.displayName || Component.name})`;

      return Object.assign(Component, {
        command: {
          ...command,
          id: typeof command.name === 'string' ? command.name : command.name[0],
        }
      });
    }
  };
}
