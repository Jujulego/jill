import { waitForEvent } from '@jujulego/event-tree';
import { type Task, type TaskManager, TaskSet } from '@jujulego/tasks';
import { inject, injectable } from 'inversify';
import { type ArgumentsCamelCase } from 'yargs';

import { TASK_MANAGER } from '@/src/tasks/task-manager.config';
import TaskManagerSpinner from '@/src/ui/task-manager-spinner';
import { type AwaitableGenerator } from '@/src/types';

import { InkCommand } from './ink-command';

// Class
@injectable()
export abstract class TaskCommand<A = unknown> extends InkCommand<A> {
  // Constructor
  constructor(
    @inject(TASK_MANAGER)
    private readonly manager: TaskManager,
  ) {
    super();
  }

  // Methods
  abstract prepare(args: ArgumentsCamelCase<A>): AwaitableGenerator<Task>;

  async *render(args: ArgumentsCamelCase<A>) {
    // Prepare tasks
    const tasks = new TaskSet(this.manager);

    for await (const tsk of this.prepare(args)) {
      tasks.add(tsk);
    }

    // Render
    yield <TaskManagerSpinner manager={this.manager} />;

    // Start tasks
    tasks.start();

    const result = await waitForEvent(tasks, 'finished');

    if (result.failed > 0) {
      return process.exit(1);
    }
  }
}
