import { ArgumentsCamelCase, Argv, CommandModule } from 'yargs';

import { type Awaitable } from '../types';

// Types
export interface Middleware<T = unknown, U = T> {
  builder?: (yargs: Argv<T>) => Awaitable<Argv<U>>;
  handler(args: ArgumentsCamelCase<U>): Awaitable<void>;
}

// Command utils
export function defineCommand<T, U>(command: CommandModule<T, U>): CommandModule<T, U> {
  return command;
}

// Middleware utils
export function defineMiddleware<T, U>(middleware: Middleware<T, U>): Middleware<T, U> {
  return middleware;
}

export async function applyMiddlewares<T>(yargs: Argv<T>, middlewares: Middleware[]): Promise<Argv<T>> {
  let tmp: Argv<unknown> = yargs;

  for (const middleware of middlewares) {
    if (middleware.builder) {
      tmp = await middleware.builder(tmp);
    }

    tmp.middleware(middleware.handler);
  }

  return tmp as Argv<T>;
}