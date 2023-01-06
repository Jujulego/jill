import { waitForEvent } from '@jujulego/event-tree';
import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { Command } from '@/src/bases/command';
import { InkCommand } from '@/src/bases/ink-command';
import { container } from '@/src/inversify.config';
import { LoadProject } from '@/src/middlewares/load-project';
import { LoadWorkspace } from '@/src/middlewares/load-workspace';
import { lazyCurrentWorkspace, Workspace, type WorkspaceDepsMode } from '@/src/project/workspace';
import { TASK_MANAGER } from '@/src/tasks/task-manager.config';
import TaskManagerSpinner from '@/src/ui/task-manager-spinner';

// Types
export interface IRunCommandArgs {
  script: string;
  'deps-mode': WorkspaceDepsMode;
}

// Command
@Command({
  command: 'run <script>',
  describe: 'Run script inside workspace',
  middlewares: [
    LoadProject,
    LoadWorkspace
  ]
})
export class RunCommand extends InkCommand<IRunCommandArgs> {
  // Lazy injections
  @lazyCurrentWorkspace()
  readonly workspace: Workspace;

  // Methods
  builder(yargs: Argv) {
    return yargs
      .positional('script', { type: 'string', demandOption: true })
      .option('deps-mode', {
        choice: ['all', 'prod', 'none'],
        default: 'all' as const,
        desc: 'Dependency selection mode:\n' +
          ' - all = dependencies AND devDependencies\n' +
          ' - prod = dependencies\n' +
          ' - none = nothing'
      });
  }

  async render(args: ArgumentsCamelCase<IRunCommandArgs>) {
    const manager = await container.getAsync(TASK_MANAGER);

    // Extract arguments
    const rest = args._.map(arg => arg.toString());

    if (rest[0] === 'run') {
      rest.splice(0, 1);
    }

    // Run script in workspace
    const task = await this.workspace.run(args.script, rest, {
      buildDeps: args.depsMode,
    });
    manager.add(task);

    // Handle result
    waitForEvent(task, 'completed').then((result) => {
      if (result.status === 'failed') {
        return process.exit(1);
      }
    });

    // Render
    return <TaskManagerSpinner manager={manager} />;
  }
}
