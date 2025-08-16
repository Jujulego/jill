import { TaskSet } from '@jujulego/tasks';
import type { WorkspaceDepsMode } from '../../projects/workspace.js';
import type { TaskModule, PlanModeArgs } from '../bases/task-module.js';
import { loadWorkspace, withWorkspace, type WorkspaceArgs } from '../middlewares/workspace.middleware.js';

// Command
const command: TaskModule<ExecArgs> = {
  command: 'exec <command>',
  aliases: ['$0'],
  describe: 'Run command inside workspace, after all its dependencies has been built.',
  builder: (args) => withWorkspace(args)
    .positional('command', { type: 'string', demandOption: true })
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

    // Documentation
    .example('jill eslint', '')
    .example('jill eslint --env-info', 'Unknown arguments are passed down to command. Here it would run eslint --env-info')
    .example('jill eslint -- -v', 'You can use -- to stop argument parsing. Here it would run eslint -v')

    // Config
    .strict(false)
    .parserConfiguration({
      'unknown-options-as-args': true,
    }),
  async prepare(args) {
    const workspace = await loadWorkspace(args);

    // Extract arguments
    const rest = args._.map(arg => arg.toString());

    if (rest[0] === 'exec') {
      rest.splice(0, 1);
    }

    // Run script in workspace
    const tasks = new TaskSet();

    tasks.add(await workspace.exec(args.command, rest, {
      buildScript: args.buildScript,
      buildDeps: args.depsMode,
    }));

    return tasks;
  },
};

export default command;

// Types
export interface ExecArgs extends PlanModeArgs, WorkspaceArgs {
  readonly command: string;
  readonly 'build-script': string;
  readonly 'deps-mode': WorkspaceDepsMode;
}
