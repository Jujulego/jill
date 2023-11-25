import { waitFor$ } from '@jujulego/event-tree';
import { Logger } from '@jujulego/logger';
import { plan as extractPlan, type Task, type TaskManager, TaskSet, type TaskSummary } from '@jujulego/tasks';
import { injectable } from 'inversify';
import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { container, lazyInject } from '@/src/inversify.config.ts';
import { isCommandCtx } from '@/src/tasks/command-task.ts';
import { isScriptCtx } from '@/src/tasks/script-task.ts';
import { TASK_MANAGER } from '@/src/tasks/task-manager.config.ts';
import { type AwaitableGenerator } from '@/src/types.ts';
import List from '@/src/ui/list.tsx';
import TaskTreeCompleted from '@/src/ui/task-tree-completed.tsx';
import TaskTreeSpinner from '@/src/ui/task-tree-spinner.tsx';
import { ExitException } from '@/src/utils/exit.ts';
import { printJson } from '@/src/utils/json.ts';

import { InkCommand } from './ink-command.tsx';

// Types
export interface ITaskCommandArgs {
  plan: boolean;
  'plan-mode': 'json' | 'list';
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
        choices: ['json', 'list'] as const,
        default: 'list' as const
      });
  }

  async* render(args: ArgumentsCamelCase<A & ITaskCommandArgs>) {
    // Prepare tasks
    const tasks = new TaskSet();

    for await (const tsk of this.prepare(args)) {
      tasks.add(tsk);
    }

    if (args.plan) {
      const plan: TaskSummary[] = Array.from(extractPlan(tasks));

      if (args.planMode === 'json') {
        printJson(plan);
      } else {
        const data = plan.map((tsk) => ({
          id: tsk.id.substring(0, 6),
          name: tsk.name,
          workspace: isCommandCtx(tsk.context) || isScriptCtx(tsk.context) ? tsk.context.workspace.name : '',
          group: tsk.groupId?.substring(0, 6),
          'depends on': tsk.dependenciesIds.map(id => id.substring(0, 6)).join(', ')
        }));

        yield <List items={data} headers/>;
      }
    } else if (tasks.tasks.length > 0) {
      // Render
      yield <TaskTreeSpinner manager={this.manager} />;

      // Start tasks
      tasks.start(this.manager);

      const result = await waitFor$(tasks, 'finished');

      this.app.clear();
      yield <TaskTreeCompleted manager={this.manager} />;

      if (result.failed > 0) {
        throw new ExitException(1);
      }
    } else {
      const logger = container.get(Logger);
      logger.warning('No task found');
    }
  }
}
