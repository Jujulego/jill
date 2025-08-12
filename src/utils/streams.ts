import { type SpawnTask } from '@jujulego/tasks';
import { type Observable, observable$, off$, once$ } from 'kyrielle';

// Utils
export async function* combine<T>(...generators: AsyncGenerator<T>[]): AsyncGenerator<T> {
  for (const gen of generators) {
    yield* gen;
  }
}

export function streamLines$(task: SpawnTask): Observable<string> {
  return observable$((observer, signal) => {
    const off = off$();
    let current = '';

    // End
    off.add(once$(task.events$, 'completed', () => {
      if (current) observer.next(current);
      observer.complete();
      off.unsubscribe();
    }));

    // Abort
    signal.addEventListener('abort', () => off.unsubscribe(), { once: true });

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