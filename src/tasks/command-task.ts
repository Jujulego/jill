import { SpawnTask, type SpawnTaskOptions, type TaskContext } from '@jujulego/tasks';

import { type Workspace } from '@/src/project/workspace';
import { linesFrom } from '@/src/utils/events';
import { type CommandLine } from '@/src/utils/string';

// Types
export interface CommandContext extends TaskContext {
  workspace: Workspace;
  command: string;
}

export type CommandOptions = Omit<SpawnTaskOptions, 'cwd'>;

// Utils
export function isCommandCtx(ctx: Readonly<TaskContext>): ctx is Readonly<CommandContext> {
  return 'workspace' in ctx && 'command' in ctx;
}

// Class
export class CommandTask extends SpawnTask<CommandContext> {
  // Constructor
  constructor(readonly workspace: Workspace, { command, args }: CommandLine, opts: CommandOptions = {}) {
    super(command, args, { workspace, command }, {
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
