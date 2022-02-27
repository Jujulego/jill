import { createContext, FC, useContext } from 'react';
import yargs from 'yargs';

// Test
export type Args<A> = yargs.ArgumentsCamelCase<A> & { '--': readonly (string | number)[] };
export type Builder<A> = (yargs: yargs.Argv) => yargs.Argv<A>;

export interface Command<A> {
  id: string;
  name: string | readonly [string, ...string[]];
  description: string;
  builder: Builder<A>;
}

export type CommandComponent<A, P> = FC<P> & {
  command: Command<A>;
}

export interface ApplicationContextState {
  args: Args<unknown>;
  command?: Command<unknown>;
}

// Context
export const applicationDefaultState: ApplicationContextState = {
  args: {
    '$0': '',
    '_': [],
    '--': []
  }
};

export const ApplicationContext = createContext(applicationDefaultState);

// Hooks
export function useArgs<A>(): Args<A> {
  const { args } = useContext(ApplicationContext);
  return args as Args<A>;
}
