import { streamEvents } from '@jujulego/event-tree';
import { SpawnTask, SpawnTaskStream } from '@jujulego/tasks';

// Utils
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
