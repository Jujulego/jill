import { Logger, withLabel } from '@jujulego/logger';
import { inject } from 'inversify';
import cp from 'node:child_process';
import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { Command } from '@/src/modules/command.ts';
import { ITaskCommandArgs, TaskCommand } from '@/src/modules/task-command.tsx';
import { LazyCurrentProject, LoadProject } from '@/src/middlewares/load-project.ts';
import { LazyCurrentWorkspace, LoadWorkspace } from '@/src/middlewares/load-workspace.ts';
import type { Project } from '@/src/project/project.ts';
import { type Workspace, type WorkspaceDepsMode } from '@/src/project/workspace.ts';
import { type CommandTask } from '@/src/tasks/command-task.ts';
import { ExitException } from '@/src/utils/exit.ts';

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
  // Attributes
  private _finalTask: CommandTask;
  private readonly _logger: Logger;

  // Lazy injections
  @LazyCurrentProject()
  readonly project: Project;

  @LazyCurrentWorkspace()
  readonly workspace: Workspace;

  // Constructor
  constructor(
    @inject(Logger) logger: Logger,
  ) {
    super();

    this._logger = logger.child(withLabel('exec'));
  }

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

  async *prepare(args: ArgumentsCamelCase<IExecCommandArgs & ITaskCommandArgs>) {
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

    if (args.plan) {
      yield task;
    } else {
      this._finalTask = task;
      yield* task.dependencies;
    }
  }

  async handler(args: ArgumentsCamelCase<IExecCommandArgs & ITaskCommandArgs>): Promise<void> {
    await super.handler(args);

    if (!args.plan) {
      this.app.unmount();

      // Execute command
      this._logger.debug`${this._finalTask.cmd} ${this._finalTask.args.join(' ')}`;

      const child = cp.spawn(this._finalTask.cmd, this._finalTask.args, {
        stdio: 'inherit',
        cwd: this._finalTask.cwd,
        env: this._finalTask.env,
        shell: true,
        windowsHide: true,
      });

      const code = await new Promise<number>((resolve) => {
        child.on('close', (code) => {
          resolve(code ?? 0);
        });
      });

      if (code) {
        throw new ExitException(code);
      }
    }
  }
}
