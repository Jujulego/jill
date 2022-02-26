import { FC, useContext } from 'react';
import yargs from 'yargs';
import { ArgsContext } from './application';

// Types
export type Arguments<A> = yargs.Arguments<A> & { '--': readonly (string | number)[] };
export type Builder<A> = (yargs: yargs.Argv) => yargs.Argv<A>;

export interface CommandMetadata<A> {
  name: string | readonly [string, ...string[]];
  description: string;
  define: Builder<A>;
}

export type CommandComponent<A, P = Record<string, unknown>> = FC<P> & {
  command: CommandMetadata<A> & { id: string };
}

// HOC
export function command<A, P = Record<string, unknown>>(command: CommandMetadata<A>, Component: FC<P & Arguments<A>>): CommandComponent<A, P> {
  const Wrapper: FC<P> = (props) => {
    const args = useContext(ArgsContext) as Arguments<A>;

    return <Component {...props} {...args} />;
  };

  Wrapper.displayName = `command(${Component.name || Component.displayName})`;

  return Object.assign(Wrapper, {
    command: {
      ...command,
      id: typeof command.name === 'string' ? command.name : command.name[0]
    }
  });
}
