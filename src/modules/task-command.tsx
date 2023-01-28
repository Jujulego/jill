import { waitForEvent } from '@jujulego/event-tree';
import { type Task, type TaskManager, TaskSet } from '@jujulego/tasks';
import { inject, injectable } from 'inversify';
import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { TASK_MANAGER } from '@/src/tasks/task-manager.config';
import TaskManagerSpinner from '@/src/ui/task-manager-spinner';
import { type AwaitableGenerator } from '@/src/types';

import { InkCommand } from './ink-command';

// Types
export interface ITaskCommandArgs {
  plan: boolean;
}

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

  builder(parser: Argv): Argv<A & ITaskCommandArgs> {
    return (parser as Argv<A>)
      .option('plan', {
        type: 'boolean',
        desc: 'Only prints tasks to be run',
        default: false,
      });
  }

  async *render(args: ArgumentsCamelCase<A & ITaskCommandArgs>) {
    // Prepare tasks
    const tasks = new TaskSet(this.manager);

    for await (const tsk of this.prepare(args)) {
      tasks.add(tsk);
    }

    if (args.plan) {
      // TODO: print all tasks to be run
      for (const task of tasks.tasks) {
        console.log(task.name);
      }
    } else {
      // Render
      yield <TaskManagerSpinner manager={this.manager}/>;

      // Start tasks
      tasks.start();

      const result = await waitForEvent(tasks, 'finished');

      if (result.failed > 0) {
        return process.exit(1);
      }
    }
  }
}
