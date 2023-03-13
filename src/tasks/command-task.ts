import { SpawnTask, type SpawnTaskOptions, type TaskContext } from '@jujulego/tasks';

import { type Workspace } from '@/src/project/workspace';
import { linesFrom } from '@/src/utils/events';

// Types
export interface CommandArgs {
  command: string;
  args: string[];
}

export interface CommandContext extends TaskContext {
  workspace: Workspace;
  command: string;
}

export type CommandOptions = Omit<SpawnTaskOptions, 'cwd'>;

// Class
export class CommandTask extends SpawnTask<CommandContext> {
  // Constructor
  constructor(readonly workspace: Workspace, { command, args }: CommandArgs, opts: CommandOptions = {}) {
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
