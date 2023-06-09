import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { Command } from '@/src/modules/command';
import { TaskCommand } from '@/src/modules/task-command';
import { LoadProject } from '@/src/middlewares/load-project';
import { LazyCurrentWorkspace, LoadWorkspace } from '@/src/middlewares/load-workspace';
import { type Workspace, type WorkspaceDepsMode } from '@/src/project/workspace';

// Types
export interface IExecCommandArgs {
  'deps-mode': WorkspaceDepsMode;
}

// Command
@Command({
  command: 'exec [command]',
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
      .option('deps-mode', {
        choice: ['all', 'prod', 'none'],
        default: 'all' as const,
        desc: 'Dependency selection mode:\n' +
          ' - all = dependencies AND devDependencies\n' +
          ' - prod = dependencies\n' +
          ' - none = nothing'
      })
      .parserConfiguration({
        'halt-at-non-option': true,
      });
  }

  async *prepare(args: ArgumentsCamelCase<IExecCommandArgs>) {
    // Extract arguments
    const rest = args._.map(arg => arg.toString());

    if (rest[0] === 'exec') {
      rest.splice(0, 2);
    }

    if (rest.length > 0) {
      // Run script in workspace
      const task = await this.workspace.exec(rest[0], rest.slice(1), {
        buildDeps: args.depsMode,
      });

      yield task;
    }
  }
}
