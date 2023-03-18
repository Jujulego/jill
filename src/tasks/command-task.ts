import { SpawnTask, type SpawnTaskOptions, type TaskContext } from '@jujulego/tasks';

import { type Workspace } from '@/src/project/workspace';
import { linesFrom } from '@/src/utils/events';

// Types
export interface CommandContext extends TaskContext {
  workspace: Workspace;
  command: string;
}

export interface CommandOptions extends Omit<SpawnTaskOptions, 'cwd'> {
  superCommand?: string;
}

// Utils
export function isCommandCtx(ctx: Readonly<TaskContext>): ctx is Readonly<CommandContext> {
  return 'workspace' in ctx && 'command' in ctx;
}

// Class
export class CommandTask extends SpawnTask<CommandContext> {
  // Constructor
  constructor(readonly workspace: Workspace, command: string, args: string[], opts: CommandOptions = {}) {
    const cmd = opts.superCommand ?? command;

    if (opts.superCommand) {
      args = [command, ...args];
    }

    super(cmd, args, { workspace, command }, {
      ...opts,
      cwd: workspace.cwd,
      env: {
        FORCE_COLOR: '1',
        ...opts.env
      }
    });

    this._logStreams();
  }

  // Methods
  private _logStreams() {
    // TODO: clean up this subscriptions
    linesFrom(this, 'stdout').subscribe((line) => this._logger.info(line));
    linesFrom(this, 'stderr').subscribe((line) => this._logger.info(line));
  }
}
