import { TaskSet } from '@jujulego/tasks';
import { inject$ } from '@kyrielle/injector';
import type { WorkspaceDepsMode } from '../../projects/workspace.js';
import type { PlanModeArgs, TaskModule } from '../bases/task-module.js';
import { loadWorkspace, withWorkspace, type WorkspaceArgs } from '../middlewares/workspace.middleware.js';
import { TaskParserService } from '../services/task-parser.service.js';

// Command
const command: TaskModule<RunArgs> = {
  command: 'run <expr>',
  aliases: ['$0'],
  describe: 'Run a task expression in a workspace, after having built all its dependencies.',
  builder: (parser) => withWorkspace(parser)
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
    }),
  async prepare(args) {
    const workspace = await loadWorkspace(args);

    // Extract expression
    const expr = args._.map(arg => arg.toString());

    if (expr[0] === 'run') {
      expr.splice(0, 1);
    }

    expr.unshift(args.expr);

    // Parse task expression
    const taskParser = inject$(TaskParserService);
    const tree = taskParser.parse(expr.join(' '));

    const tasks = new TaskSet();
    tasks.add(await taskParser.buildTask(tree.roots[0], workspace, {
      buildScript: args.buildScript,
      buildDeps: args.depsMode,
    }));

    return tasks;
  }
};

export default command;

// Types
export interface RunArgs extends PlanModeArgs, WorkspaceArgs {
  readonly expr: string;
  readonly 'build-script': string;
  readonly 'deps-mode': WorkspaceDepsMode;
}
