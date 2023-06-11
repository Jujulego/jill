import { iterate, offGroup, once } from '@jujulego/event-tree';
import { type SpawnTask, type SpawnTaskStream } from '@jujulego/tasks';

// Utils
export async function* combine<T>(...generators: AsyncGenerator<T>[]): AsyncGenerator<T> {
  for (const gen of generators) {
    yield* gen;
  }
}

export async function *streamLines(task: SpawnTask, stream: SpawnTaskStream): AsyncGenerator<string> {
  // Abort
  const off = offGroup();
  once(task, 'completed', off);

  // Stream
  let current = '';

  try {
    for await (const chunk of iterate(task, `stream.${stream}`, { off })) {
      const data = current + chunk.data.toString('utf-8');
      const lines = data.split(/\r?\n/);

      current = lines.pop() ?? '';

      for (const line of lines) {
        yield line;
      }
    }
  } catch (err) {
    if (err.message !== 'Unsubscribed !') {
      throw err;
    }

    if (current) {
      yield current;
    }
  }
}
