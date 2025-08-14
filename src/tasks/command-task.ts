import { SpawnTask, type SpawnTaskOptions, type TaskContext } from '@jujulego/tasks';
import { off$, once$ } from 'kyrielle';
import type { Workspace } from '../projects/workspace.js';
import { streamLines$ } from '../utils/streams.js';

// Class
export class CommandTask extends SpawnTask<CommandContext> {
  // Constructor
  constructor(readonly workspace: Workspace, command: string, args: string[], opts: CommandOptions = {}) {
    let cmd = command;

    if (opts.superCommand) {
      if (typeof opts.superCommand === 'string') {
        opts.superCommand = [opts.superCommand];
      }

      if (opts.superCommand.length > 0) {
        cmd = opts.superCommand[0];
        args = [...opts.superCommand.slice(1), command, ...args];
      }
    }

    super(cmd, args, { workspace, command }, {
      ...opts,
      cwd: workspace.root,
      env: {
        FORCE_COLOR: '1',
        ...opts.env
      }
    });

    this._logStreams();
  }

  // Methods
  private _logStreams() {
    const off = off$(
      streamLines$(this, 'stdout').subscribe((line) => this.logger$.info(line)),
      streamLines$(this, 'stderr').subscribe((line) => this.logger$.info(line)),
    );

    once$(this.events$, 'completed', () => {
      off.unsubscribe();
    });
  }
}

// Types
export interface CommandContext extends TaskContext {
  workspace: Workspace;
  command: string;
}

export interface CommandOptions extends Omit<SpawnTaskOptions, 'cwd'> {
  superCommand?: string | readonly string[] | undefined;
}

// Utils
export function isCommandCtx(ctx: Readonly<TaskContext>): ctx is Readonly<CommandContext> {
  return 'workspace' in ctx && 'command' in ctx;
}
