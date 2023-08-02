import { inject } from 'inversify';
import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { Logger } from '@/src/commons/logger.service.ts';
import { Command } from '@/src/modules/command.ts';
import { TaskCommand } from '@/src/modules/task-command.tsx';
import { LoadProject } from '@/src/middlewares/load-project.ts';
import { LazyCurrentWorkspace, LoadWorkspace } from '@/src/middlewares/load-workspace.ts';
import { type Workspace, type WorkspaceDepsMode } from '@/src/project/workspace.ts';
import { ExitException } from '@/src/utils/exit.ts';

// Types
export interface IRunCommandArgs {
  script: string;
  'build-script': string;
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
export class RunCommand extends TaskCommand<IRunCommandArgs> {
  // Lazy injections
  @LazyCurrentWorkspace()
  readonly workspace: Workspace;

  // Constructor
  constructor(
    @inject(Logger)
    private readonly logger: Logger,
  ) {
    super();
  }

  // Methods
  builder(parser: Argv) {
    return this.addTaskOptions(parser)
      .positional('script', { type: 'string', demandOption: true })
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
    // Extract arguments
    const rest = args._.map(arg => arg.toString());

    if (rest[0] === 'run') {
      rest.splice(0, 1);
    }

    // Run script in workspace
    const task = await this.workspace.run(args.script, rest, {
      buildScript: args.buildScript,
      buildDeps: args.depsMode,
    });

    if (task) {
      yield task;
    } else {
      this.logger.error`Workspace ${this.workspace.name} have no ${args.script} script`;
      throw new ExitException(1);
    }
  }
}
