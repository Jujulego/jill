import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { Command } from '@/src/modules/command';
import { TaskCommand } from '@/src/modules/task-command';
import { LoadProject } from '@/src/middlewares/load-project';
import { LazyCurrentWorkspace, LoadWorkspace } from '@/src/middlewares/load-workspace';
import { type Workspace, type WorkspaceDepsMode } from '@/src/project/workspace';

// Types
export interface IExecCommandArgs {
  command: string;
  'deps-mode': WorkspaceDepsMode;
}

// Command
@Command({
  command: 'exec <command>',
  aliases: ['$0'],
  describe: 'Run command inside workspace',
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
      .option('deps-mode', {
        choice: ['all', 'prod', 'none'],
        default: 'all' as const,
        desc: 'Dependency selection mode:\n' +
          ' - all = dependencies AND devDependencies\n' +
          ' - prod = dependencies\n' +
          ' - none = nothing'
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
      buildDeps: args.depsMode,
    });

    yield task;
  }
}
