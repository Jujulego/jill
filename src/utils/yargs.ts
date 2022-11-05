import { Arguments, Argv, CommandModule } from 'yargs';

import { Awaitable } from '../types';

// Types
export interface Middleware<T = unknown, U = unknown> {
  builder?: (yargs: Argv<T>) => Argv<U>;
  handler(args: Arguments<U>): Awaitable<void>;
}

// Command utils
export function defineCommand<T, U>(command: CommandModule<T, U>): CommandModule<T, U> {
  return command;
}

// Middleware utils
export function defineMiddleware<T, U>(middleware: Middleware<T, U>): Middleware<T, U> {
  return middleware;
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
