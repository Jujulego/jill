import { streamEvents } from '@jujulego/event-tree';
import { SpawnTask, SpawnTaskStream } from '@jujulego/tasks';
import { Argv, CommandModule } from 'yargs';

// Stream utils
export async function* combine<T>(...generators: AsyncGenerator<T>[]): AsyncGenerator<T> {
  for (const gen of generators) {
    yield* gen;
  }
}

export async function *streamLines(task: SpawnTask, stream: SpawnTaskStream): AsyncGenerator<string> {
  // Abort
  const ctrl = new AbortController();

  task.subscribe('status.done', () => ctrl.abort());
  task.subscribe('status.failed', () => ctrl.abort());

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
export type Modifier<T = unknown, U = unknown> = (yargs: Argv<T>) => void | Argv<U>;

export function applyModifiers<T>(yargs: Argv<T>, modifiers: Modifier[]): Argv<T> {
  let tmp: Argv<unknown> = yargs;

  for (const modifier of modifiers) {
    tmp = modifier(tmp) ?? tmp;
  }

  return tmp as Argv<T>;
}

export function defineCommand<T, U>(command: CommandModule<T, U>): CommandModule<T, U> {
  return command;
}
