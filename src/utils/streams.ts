import { SpawnTask, SpawnTaskStream } from '@jujulego/tasks';
import { streamEvents } from '@jujulego/event-tree';

// Utils
export async function* combine<T>(...generators: AsyncGenerator<T>[]): AsyncGenerator<T> {
  for (const gen of generators) {
    yield* gen;
  }
}

export async function *streamLines(task: SpawnTask, stream: SpawnTaskStream): AsyncGenerator<string> {
  // Abort
  const ctrl = new AbortController();
  const reason = new Error('aborted');

  task.subscribe('completed', () => ctrl.abort(reason));

  // Stream
  let current = '';

  try {
    for await (const chunk of streamEvents(task, `stream.${stream}`, { signal: ctrl.signal })) {
      const data = current + chunk.data.toString('utf-8');
      const lines = data.split(/\r?\n/);

      current = lines.pop() ?? '';

      for (const line of lines) {
        yield line;
      }
    }
  } catch (err) {
    if (err !== reason) {
      throw err;
    }

    if (current) {
      yield current;
    }
  }
}
