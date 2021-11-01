import { SpawnTask, SpawnTaskOption } from '@jujulego/jill-core';
import { createHash } from 'crypto';
import path from 'path';

import { ITask } from './task.model';

// Class
export class WatchTask extends SpawnTask {
  // Attributes
  readonly id: string;

  // Constructor
  constructor(
    cwd: string,
    cmd: string,
    args?: readonly string[],
    opts?: SpawnTaskOption
  ) {
    super(cmd, args, { ...opts, cwd });
    this.id = WatchTask.generateTaskId(cwd, cmd);
  }

  // Statics
  static generateTaskId(cwd: string, cmd: string): string {
    return createHash('md5')
      .update(path.resolve(cwd))
      .update(cmd)
      .digest('hex');
  }

  // Methods
  toPlain(): ITask {
    return {
      id: this.id,
      cwd: this.cwd,
      cmd: this.cmd,
      args: this.args,
      status: this.status
    };
  }
}