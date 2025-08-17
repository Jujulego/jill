import { TaskSet } from '@jujulego/tasks';
import { inject$ } from '@kyrielle/injector';
import { asyncIterator$, pipe$, type SimpleAsyncIterator } from 'kyrielle';
import { isAffected$ } from '../../filters/affected.filter.js';
import { pipeline$ } from '../../filters/pipeline$.js';
import { isPrivate$ } from '../../filters/private.filter.js';
import { hasEveryScript$ } from '../../filters/scripts.filter.js';
import type { Workspace, WorkspaceDepsMode } from '../../projects/workspace.js';
import type { PlanModeArgs, TaskModule } from '../bases/task-module.js';
import { loadProject, type ProjectArgs, withProject } from '../middlewares/project.middleware.js';
import { TaskParserService } from '../services/task-parser.service.js';

// Command
const command: TaskModule<EachArgs> = {
  command: 'each <expr>',
  describe: 'Run a task expression in many workspace, after having built all theirs dependencies.',
  builder: (parser) => withProject(parser)
    .positional('expr', {
      type: 'string',
      demandOption: true,
      desc: 'Script or task expression',
    })
    .option('affected', {
      alias: 'a',
      type: 'string',
      coerce: (rev: string) => rev === '' ? 'master' : rev,
      group: 'Filters:',
      desc: 'Print only affected workspaces towards given git revision. If no revision is given, it will check towards master. Replaces %name by workspace name.',
    })
    .option('affected-rev-fallback', {
      type: 'string',
      default: 'master',
      group: 'Filters:',
      desc: 'Fallback revision, used if no revision matching the given format is found',
    })
    .option('affected-rev-sort', {
      type: 'string',
      group: 'Filters:',
      desc: 'Sort applied to git tag / git branch command',
    })
    .option('allow-no-workspaces', {
      type: 'boolean',
      default: false,
      desc: 'Allow no matching workspaces. Without it jill will exit with code 1 if no workspace matches',
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
    .option('private', {
      type: 'boolean',
      group: 'Filters:',
      describe: 'Print only private workspaces',
    }),
  async prepare(args) {
    // Extract expression
    const expr = args._.map(arg => arg.toString());

    if (expr[0] === 'each') {
      expr.splice(0, 1);
    }

    expr.unshift(args.expr);

    // Prepare filters
    let filters = pipeline$<SimpleAsyncIterator<Workspace>>();

    if (args.private !== undefined) {
      filters = filters.add(isPrivate$(args.private));
    }

    if (args.affected !== undefined) {
      filters = filters.add(isAffected$({
        format: args.affected,
        fallback: args.affectedRevFallback,
        sort: args.affectedRevSort,
      }));
    }

    // Parse task expression
    const taskParser = inject$(TaskParserService);
    const tree = taskParser.parse(expr.join(' '));

    const scripts = Array.from(taskParser.extractScripts(tree));

    // Load workspaces
    const project = loadProject(args);
    const workspaces = pipe$(
      asyncIterator$(project.workspaces()),
      hasEveryScript$(scripts),
      filters.build(),
    );

    // Prepare tasks
    const tasks = new TaskSet();

    for await (const wks of workspaces) {
      tasks.add(await taskParser.buildTask(tree.roots[0], wks, {
        buildScript: args.buildScript,
        buildDeps: args.depsMode,
      }));
    }

    return tasks;
  }
};

export default command;

// Types
export interface EachArgs extends PlanModeArgs, ProjectArgs {
  readonly affected: string | undefined;
  readonly 'affected-rev-fallback': string;
  readonly 'affected-rev-sort': string | undefined;
  readonly 'allow-no-workspaces': boolean;
  readonly 'build-script': string;
  readonly 'deps-mode': WorkspaceDepsMode;
  readonly expr: string;
  readonly private: boolean | undefined;
}
