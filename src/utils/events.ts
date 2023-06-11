import { once, source, type Source } from '@jujulego/event-tree';
import { type SpawnTask, type SpawnTaskStream } from '@jujulego/tasks';

// Utils
export function linesFrom(task: SpawnTask, stream: SpawnTaskStream): Source<string> {
  const inner = source<string>();

  if (task.completed) {
    return inner;
  }

  // Listen to stream
  let current = '';

  const stop = task.on(`stream.${stream}`, (chunk) => {
    const data = current + chunk.data.toString('utf-8');
    const lines = data.split(/\r?\n/);

    current = lines.pop() ?? '';

    for (const line of lines) {
      inner.next(line);
    }
  });

  // Listen to end of task
  once(task, 'completed', () => {
    stop();

    if (current) {
      inner.next(current);
    }
  });

  return inner;
}
