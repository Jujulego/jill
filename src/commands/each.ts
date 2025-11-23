import { inject$ } from '@kyrielle/injector';
import { parallelFlow$ } from '@kyrielle/workload';
import { asyncIterator$, collect$, pipe$, type SimpleAsyncIterator, waitFor$ } from 'kyrielle';
import type { PlanModeArgs } from '../middlewares/with-plan.js';
import { loadProject, type ProjectArgs, withProject } from '../middlewares/with-project.js';
import { hasEveryScript$ } from '../projects/filters/has-scripts.js';
import { isAffected$ } from '../projects/filters/is-affected.js';
import { isPrivate$ } from '../projects/filters/is-private.js';
import type { Workspace, WorkspaceDepsMode } from '../projects/workspace.js';
import { TaskParserService } from '../services/task-parser.service.js';
import { pipeline$ } from '../utils/pipeline$.js';
import type { JobCommandModule } from '../wrappers/job-command.js';

// Command
const command: JobCommandModule<EachArgs> = {
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
    })

    // Config
    .strict(false)
    .parserConfiguration({
      'unknown-options-as-args': true,
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
    const workspaces = await waitFor$(pipe$(
      asyncIterator$(project.workspaces()),
      hasEveryScript$(scripts),
      filters.build(),
      collect$()
    ));
    workspaces.sort((a, b) => a.name.localeCompare(b.name));

    if (workspaces.length === 0) {
      return;
    }
    
    // Prepare tasks
    const flow = parallelFlow$({ label: '[hidden]' });

    for (const wks of workspaces) {
      flow.push(await taskParser.buildJob(tree.roots[0], wks, {
        buildScript: args.buildScript,
        buildDeps: args.depsMode,
      }));
    }

    return flow;
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
