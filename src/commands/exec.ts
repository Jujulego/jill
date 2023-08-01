import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { Command } from '@/src/modules/command.ts';
import { TaskCommand } from '@/src/modules/task-command.tsx';
import { LoadProject } from '@/src/middlewares/load-project.ts';
import { LazyCurrentWorkspace, LoadWorkspace } from '@/src/middlewares/load-workspace.ts';
import { type Workspace, type WorkspaceDepsMode } from '@/src/project/workspace.ts';

// Types
export interface IExecCommandArgs {
  command: string;
  'build-script': string;
  'deps-mode': WorkspaceDepsMode;
}

// Command
@Command({
  command: 'exec <command>',
  aliases: ['$0'],
  describe: 'Run command inside workspace, after all its dependencies has been built.',
  middlewares: [
    LoadProject,
    LoadWorkspace
  ]
})
export class ExecCommand extends TaskCommand<IExecCommandArgs> {
  // Lazy injections
  @LazyCurrentWorkspace()
  readonly workspace: Workspace;

  // Methods
  builder(parser: Argv) {
    return this.addTaskOptions(parser)
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
      });
  }

  async *prepare(args: ArgumentsCamelCase<IExecCommandArgs>) {
    // Extract arguments
    const rest = args._.map(arg => arg.toString());

    if (rest[0] === 'exec') {
      rest.splice(0, 1);
    }

    // Run script in workspace
    const task = await this.workspace.exec(args.command, rest, {
      buildScript: args.buildScript,
      buildDeps: args.depsMode,
    });

    yield task;
  }
}
