import { Logger } from '@jujulego/logger';
import { inject } from 'inversify';
import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { Command } from '@/src/modules/command.ts';
import { TaskCommand } from '@/src/modules/task-command.tsx';
import { LoadProject } from '@/src/middlewares/load-project.ts';
import { LazyCurrentWorkspace, LoadWorkspace } from '@/src/middlewares/load-workspace.ts';
import { type Workspace, type WorkspaceDepsMode } from '@/src/project/workspace.ts';
import { TaskExprService } from '@/src/tasks/task-expr.service.ts';
import { TaskExpressionError, TaskSyntaxError } from '@/src/tasks/errors.ts';
import { ExitException } from '@/src/utils/exit.ts';

// Types
export interface IRunCommandArgs {
  expr: string;
  'build-script': string;
  'deps-mode': WorkspaceDepsMode;
}

// Command
@Command({
  command: 'run <expr>',
  describe: 'Run a task expression in a workspace, after having built all its dependencies.',
  middlewares: [
    LoadProject,
    LoadWorkspace
  ]
})
export class RunCommand extends TaskCommand<IRunCommandArgs> {
  // Lazy injections
  @LazyCurrentWorkspace()
  readonly workspace: Workspace;

  // Constructor
  constructor(
    @inject(Logger)
    private readonly logger: Logger,
    @inject(TaskExprService)
    private readonly taskExpr: TaskExprService,
  ) {
    super();
  }

  // Methods
  builder(parser: Argv) {
    return this.addTaskOptions(parser)
      .positional('expr', {
        type: 'string',
        demandOption: true,
        desc: 'Script or task expression',
      })
      .option('build-script', {
        default: 'build',
        desc: 'Script to use to build dependencies'
      })
      .option('deps-mode', {
        alias: 'd',
        choice: ['all', 'prod', 'none'],
        default: 'all' as const,
        desc: 'Dependency selection mode:\n' +
          ' - all = dependencies AND devDependencies\n' +
          ' - prod = dependencies\n' +
          ' - none = nothing'
      })

      // Config
      .strict(false)
      .parserConfiguration({
        'unknown-options-as-args': true,
      });
  }

  async *prepare(args: ArgumentsCamelCase<IRunCommandArgs>) {
    // Extract expression
    const expr = args._.map(arg => arg.toString());

    if (expr[0] === 'run') {
      expr.splice(0, 1);
    }

    expr.unshift(args.expr);

    // Parse task expression
    try {
      const tree = this.taskExpr.parse(expr.join(' '));

      yield await this.taskExpr.buildTask(tree.roots[0], this.workspace, {
        buildScript: args.buildScript,
        buildDeps: args.depsMode,
      });
    } catch (err) {
      if (err instanceof TaskExpressionError) {
        this.logger.error(err.message);
        throw new ExitException(1);
      }

      if (err instanceof TaskSyntaxError) {
        this.logger.error(`Syntax error in task expression: ${err.message}`);
        throw new ExitException(1);
      }

      throw err;
    }
  }
}
