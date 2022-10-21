import { streamEvents } from '@jujulego/event-tree';
import { SpawnTask, SpawnTaskStream } from '@jujulego/tasks';
import { Arguments, Argv, CommandModule } from 'yargs';
import { Awaitable } from './types';

// Stream utils
export async function* combine<T>(...generators: AsyncGenerator<T>[]): AsyncGenerator<T> {
  for (const gen of generators) {
    yield* gen;
  }
}

export async function *streamLines(task: SpawnTask, stream: SpawnTaskStream): AsyncGenerator<string> {
  // Abort
  const ctrl = new AbortController();

  task.subscribe('completed', () => ctrl.abort());

  // Stream
  let current = '';

  try {
    for await (const chunk of streamEvents(task, `stream.${stream}`, { signal: ctrl.signal })) {
      const data = current + chunk.data.toString('utf-8');
      const lines = data.split(/\r?\n/g);

      current = lines.pop() ?? '';

      for (const line of lines) {
        yield line;
      }
    }
  } catch (err) {
    if (task.exitCode !== 0) {
      throw err;
    }

    if (current) {
      yield current;
    }
  }
}

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
