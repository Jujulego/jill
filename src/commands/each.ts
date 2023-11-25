import { Logger } from '@jujulego/logger';
import { inject } from 'inversify';
import symbols from 'log-symbols';
import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { AffectedFilter } from '@/src/filters/affected.filter.ts';
import { Pipeline } from '@/src/filters/pipeline.ts';
import { PrivateFilter } from '@/src/filters/private.filter.ts';
import { ScriptsFilter } from '@/src/filters/scripts.filter.ts';
import { LazyCurrentProject, LoadProject } from '@/src/middlewares/load-project.ts';
import { Command } from '@/src/modules/command.ts';
import { TaskCommand } from '@/src/modules/task-command.tsx';
import { type Project } from '@/src/project/project.ts';
import { type WorkspaceDepsMode } from '@/src/project/workspace.ts';
import { TaskExpressionError, TaskSyntaxError } from '@/src/tasks/errors.ts';
import { TaskExpressionService } from '@/src/tasks/task-expression.service.ts';
import { ExitException } from '@/src/utils/exit.ts';

// Types
export interface EachCommandArgs {
  expr: string;
  'build-script': string;
  'deps-mode': WorkspaceDepsMode;
  'allow-no-workspaces'?: boolean;

  // Filters
  private?: boolean;

  // Affected filter
  affected: string;
  'affected-rev-fallback': string;
  'affected-rev-sort'?: string;
}

// Command
@Command({
  command: 'each <expr>',
  describe: 'Run a task expression in many workspace, after having built all theirs dependencies.',
  middlewares: [
    LoadProject
  ]
})
export class EachCommand extends TaskCommand<EachCommandArgs> {
  // Lazy injections
  @LazyCurrentProject()
  readonly project: Project;

  // Constructor
  constructor(
    @inject(Logger)
    private readonly logger: Logger,
    @inject(TaskExpressionService)
    private readonly taskExpression: TaskExpressionService,
  ) {
    super();
  }

  // Methods
  builder(parser: Argv): Argv<EachCommandArgs> {
    return this.addTaskOptions(parser)
      // Run options
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
      .option('allow-no-workspaces', {
        type: 'boolean',
        default: false,
        desc: 'Allow no matching workspaces. Without it jill will exit with code 1 if no workspace matches',
      })

      // Filters
      .option('private', {
        type: 'boolean',
        group: 'Filters:',
        desc: 'Print only private workspaces',
      })
      .option('affected', {
        alias: 'a',
        type: 'string',
        coerce: (rev) => rev === '' ? 'master' : rev,
        group: 'Filters:',
        desc: 'Print only affected workspaces towards given git revision. If no revision is given, it will check towards master. Replaces %name by workspace name.',
      })
      .option('affected-rev-sort', {
        type: 'string',
        group: 'Filters:',
        desc: 'Sort applied to git tag / git branch command',
      })
      .option('affected-rev-fallback', {
        type: 'string',
        default: 'master',
        group: 'Filters:',
        desc: 'Fallback revision, used if no revision matching the given format is found',
      })

      // Config
      .strict(false)
      .parserConfiguration({
        'unknown-options-as-args': true,
      });
  }

  async *prepare(argv: ArgumentsCamelCase<EachCommandArgs>) {
    let empty = true;

    try {
      // Extract expression
      const expr = argv._.map(arg => arg.toString());

      if (expr[0] === 'each') {
        expr.splice(0, 1);
      }

      expr.unshift(argv.expr);

      const tree = this.taskExpression.parse(expr.join(' '));
      const scripts = Array.from(this.taskExpression.extractScripts(tree));

      // Create script tasks
      const pipeline = this._preparePipeline(argv, scripts);

      for await (const wks of pipeline.filter(this.project.workspaces())) {
        const task = await this.taskExpression.buildTask(tree.roots[0], wks, {
          buildScript: argv.buildScript,
          buildDeps: argv.depsMode,
        });

        if (task) {
          yield task;
          empty = false;
        }
      }
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

    if (empty) {
      this.logger.error(`${symbols.error} No matching workspace found !`);

      if (argv.allowNoWorkspaces === false) {
        throw new ExitException(1);
      }
    }
  }

  private _preparePipeline(argv: ArgumentsCamelCase<EachCommandArgs>, scripts: string[]): Pipeline {
    const pipeline = new Pipeline();
    pipeline.add(new ScriptsFilter(scripts, true));

    if (argv.private !== undefined) {
      pipeline.add(new PrivateFilter(argv.private));
    }

    if (argv.affected !== undefined) {
      pipeline.add(new AffectedFilter(
        argv.affected,
        argv.affectedRevFallback,
        argv.affectedRevSort
      ));
    }

    return pipeline;
  }
}
