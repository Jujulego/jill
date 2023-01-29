import { type Task } from '@jujulego/tasks';

// Utils
export function *extractAllTasks(tasks: Iterable<Task>, marks = new Set<string>()): Generator<Task, void, undefined> {
  for (const task of tasks) {
    if (marks.has(task.id)) {
      continue;
    }

    marks.add(task.id);

    yield task;
    yield* extractAllTasks(task.dependencies, marks);
  }
}
