import { waitForEvent } from '@jujulego/event-tree';
import { plan as extractPlan, type Task, type TaskManager, TaskSet } from '@jujulego/tasks';
import { injectable } from 'inversify';
import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { lazyInject } from '@/src/inversify.config';
import { TASK_MANAGER } from '@/src/tasks/task-manager.config';
import { type AwaitableGenerator } from '@/src/types';
import TaskManagerSpinner from '@/src/ui/task-manager-spinner';

import { InkCommand } from './ink-command';
import { printJson } from '@/src/utils/json';

// Types
export interface ITaskCommandArgs {
  plan: boolean;
  'plan-mode': 'json';
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
      })
      .option('plan-mode', {
        type: 'string',
        desc: 'Plan output mode',
        choices: ['json'] as const,
        default: 'json' as const
      });
  }

  async *render(args: ArgumentsCamelCase<A & ITaskCommandArgs>) {
    // Prepare tasks
    const tasks = new TaskSet(this.manager);

    for await (const tsk of this.prepare(args)) {
      tasks.add(tsk);
    }

    if (args.plan) {
      const plan = Array.from(extractPlan(tasks));
      printJson(plan);
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
