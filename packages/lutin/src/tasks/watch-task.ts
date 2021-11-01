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
    this.id = WatchTask.generateTaskId(cwd, cmd, args);
  }

  // Statics
  static generateTaskId(cwd: string, cmd: string, args: readonly string[] = []): string {
    let hash = createHash('md5')
      .update(path.resolve(cwd))
      .update(cmd);

    for (const arg of args) {
      hash = hash.update(arg);
    }

    return hash.digest('hex');
  }

  // Methods
  toPlain(): ITask {
    return {
      id: this.id,
      cwd: path.resolve(this.cwd),
      cmd: this.cmd,
      args: this.args,
      status: this.status
    };
  }
}