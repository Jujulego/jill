import { Arguments, Argv, CommandModule } from 'yargs';

import { Awaitable } from '../types';

export * from './streams';

// Command utils
export interface Middleware<T = unknown, U = unknown> {
  builder?: (yargs: Argv<T>) => Argv<U>;
  handler(args: Arguments<U>): Awaitable<void>;
}

export function applyMiddlewares<T>(yargs: Argv<T>, middlewares: Middleware[]): Argv<T> {
  let tmp: Argv<unknown> = yargs;

  for (const middleware of middlewares) {
    if (middleware.builder) {
      tmp = middleware.builder(tmp);
    }

    tmp.middleware(middleware.handler);
  }

  return tmp as Argv<T>;
}

export function defineCommand<T, U>(command: CommandModule<T, U>): CommandModule<T, U> {
  return command;
}

export function defineMiddleware<T, U>(middleware: Middleware<T, U>): Middleware<T, U> {
  return middleware;
}

// String utils
export function capitalize(txt: string): string {
  return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
}
