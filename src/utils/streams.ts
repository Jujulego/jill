import { type SpawnTask } from '@jujulego/tasks';
import { iterate$, type Observable, observable$, off$, once$ } from 'kyrielle';

// Utils
export async function* combine<T>(...generators: AsyncGenerator<T>[]): AsyncGenerator<T> {
  for (const gen of generators) {
    yield* gen;
  }
}

/** @deprecated */
export async function *streamLines(task: SpawnTask): AsyncGenerator<string> {
  // Abort
  let completed = false;

  once$(task.events$, 'completed', () => {
    completed = true;
  });

  // Stream
  let current = '';

  for await (const chunk of iterate$(task.events$.getOrigin('stream').getOrigin('stdout'))) {
    const data = current + chunk.data.toString('utf-8');
    const lines = data.split(/\r?\n/);

    current = lines.pop() ?? '';

    for (const line of lines) {
      yield line;
    }

    if (completed) {
      break;
    }
  }

  yield current;
}

export function streamLines$(task: SpawnTask): Observable<string> {
  return observable$((observer, signal) => {
    const off = off$();
    let current = '';

    // Abort
    function abort() {
      if (current) observer.next(current);
      observer.complete();
      off.unsubscribe();
    }

    off.add(once$(task.events$, 'completed', abort));
    signal.addEventListener('abort', abort, { once: true });

    // Steam
    off.add(task.events$.on('stream.stdout', (chunk) => {
      const data = current + chunk.data.toString('utf-8');
      const lines = data.split(/\r?\n/);

      current = lines.pop() ?? '';

      for (const line of lines) {
        observer.next(line);
      }
    }));
  });
}