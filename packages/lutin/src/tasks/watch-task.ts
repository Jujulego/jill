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
    cmd: string,
    args?: ReadonlyArray<string>,
    opts?: SpawnTaskOption
  ) {
    super(cmd, args, opts);
    this.id = WatchTask.generateTaskId(cmd, opts?.cwd);
  }

  // Statics
  static generateTaskId(cmd: string, cwd: string = process.cwd()): string {
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