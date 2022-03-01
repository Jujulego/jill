import { createContext, FC, isValidElement, ReactElement, useContext } from 'react';
import yargs from 'yargs';

// Test
export type Args<A> = yargs.ArgumentsCamelCase<A> & { '--': readonly (string | number)[] };
export type Builder<A> = (yargs: yargs.Argv) => yargs.Argv<A>;
export type BuilderWrapper<A> = <Args>(yargs: yargs.Argv<Args>) => yargs.Argv<Omit<Args, keyof A> & A>;

export interface GlobalArgs {
  plugins: string[];
  verbose: number;
}

export interface Command<A> {
  id: string;
  name: string | readonly [string, ...string[]];
  description: string;
  builder: Builder<A>;
}

export interface ApplicationContextState {
  args: Args<unknown>;
  command?: Command<unknown>;
}

export interface CommandComponent<A, P> extends FC<P> {
  command: Command<A>;
}

export type UseArgsHook<A> = () => Args<A & GlobalArgs>;

// Utils
export function isCommandElement(el: any): el is ReactElement<unknown, CommandComponent<unknown, unknown>> {
  return isValidElement(el) && (typeof el.type !== 'string') && ('command' in el.type);
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
export function useArgs<A>(): Args<A & GlobalArgs> {
  const { args } = useContext(ApplicationContext);
  return args as Args<A & GlobalArgs>;
}
