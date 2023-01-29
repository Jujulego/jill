import { waitForEvent } from '@jujulego/event-tree';
import { type Task, type TaskManager, TaskSet } from '@jujulego/tasks';
import { injectable } from 'inversify';
import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { lazyInject } from '@/src/inversify.config';
import { TASK_MANAGER } from '@/src/tasks/task-manager.config';
import { type AwaitableGenerator } from '@/src/types';
import TaskManagerSpinner from '@/src/ui/task-manager-spinner';

import { InkCommand } from './ink-command';
import { extractAllTasks } from '@/src/utils/tasks';
import TaskGraph from '@/src/modules/task-graph';

// Types
export interface ITaskCommandArgs {
  plan: boolean;
}

// Class
@injectable()
export abstract class TaskCommand<A = unknown> extends InkCommand<A> {
  // Attributes
  @lazyInject(TASK_MANAGER)
  readonly manager: TaskManager;

  // Methods
  abstract prepare(args: ArgumentsCamelCase<A>): AwaitableGenerator<Task>;

  protected addTaskOptions(parser: Argv): Argv<ITaskCommandArgs> {
    return parser
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
      yield <TaskGraph set={tasks} />;
    } else {
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
}
