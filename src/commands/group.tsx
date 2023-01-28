import { type TaskManager } from '@jujulego/tasks';
import { inject } from 'inversify';
import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { Command } from '@/src/modules/command';
import { TaskCommand } from '@/src/modules/task-command';
import { LoadProject } from '@/src/middlewares/load-project';
import { LoadWorkspace } from '@/src/middlewares/load-workspace';
import { lazyCurrentWorkspace, type Workspace, type WorkspaceDepsMode } from '@/src/project/workspace';
import { TaskExprService, type TaskTree } from '@/src/tasks/task-expr.service';
import { TASK_MANAGER } from '@/src/tasks/task-manager.config';

// Types
export interface IGroupCommandArgs {
  script: TaskTree;
  'deps-mode': WorkspaceDepsMode;
}

// Command
@Command({
  command: 'group <script..>',
  describe: 'Run many scripts inside a workspace (experimental)',
  middlewares: [
    LoadProject,
    LoadWorkspace
  ]
})
export class GroupCommand extends TaskCommand<IGroupCommandArgs> {
  // Lazy injections
  @lazyCurrentWorkspace()
  readonly workspace: Workspace;

  // Constructor
  constructor(
    @inject(TaskExprService)
    private readonly taskExpr: TaskExprService,
    @inject(TASK_MANAGER)
    manager: TaskManager,
  ) {
    super(manager);
  }

  // Methods
  builder(parser: Argv): Argv<IGroupCommandArgs> {
    return parser
      .positional('script', {
        demandOption: true,
        coerce: (expr: string[]) => {
          return this.taskExpr.parse(expr.join(' '));
        }
      })
      .option('deps-mode', {
        choice: ['all', 'prod', 'none'],
        default: 'all' as const,
        desc: 'Dependency selection mode:\n' +
          ' - all = dependencies AND devDependencies\n' +
          ' - prod = dependencies\n' +
          ' - none = nothing'
      });
  }

  async *prepare(args: ArgumentsCamelCase<IGroupCommandArgs>) {
    // Run script in workspace
    const group = await this.taskExpr.buildTask(args.script.roots[0], this.workspace, {
      buildDeps: args.depsMode,
    });

    yield group;
  }
}
