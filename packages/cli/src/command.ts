import { FC } from 'react';

import { GlobalArgs } from './application';
import { Args, Command, CommandComponent, useArgs } from './application.context';

// Types
export type CommandMetadata<A> = Omit<Command<A>, 'id'>

export interface CommandUtils<A> {
  useArgs: () => Args<A & GlobalArgs>;
  wrapper: <P>(Component: FC<P>) => CommandComponent<A, P>;
}

// Generate HOC & Hook for command components
export function command<A>(command: CommandMetadata<A>): CommandUtils<A> {
  return {
    useArgs: () => useArgs<A & GlobalArgs>(),
    wrapper: <P>(Component: FC<P>): CommandComponent<A, P> => {
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
