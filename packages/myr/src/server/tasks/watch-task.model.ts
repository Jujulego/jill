import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { SpawnTask, SpawnTaskOption } from '@jujulego/jill-core';
import { createHash } from 'crypto';
import path from 'path';

import { IWatchTask, SpawnTaskMode, WatchTaskStatus } from '../../common';

// Enums
registerEnumType(WatchTaskStatus, {
  name: 'WatchTaskStatus',
  description: 'Task status',
  valuesMap: {
    BLOCKED: {
      description: 'Blocked by an other task'
    },
    READY: {
      description: 'Ready to run',
    },
    RUNNING: {
      description: 'Running'
    },
    DONE: {
      description: 'Task finished successfully'
    },
    FAILED: {
      description: 'Task failed to run (or killed)'
    }
  }
});

// Model
@ObjectType()
export class WatchTask extends SpawnTask implements IWatchTask {
  // Attributes
  @Field(() => ID)
  id: string;

  @Field()
  override cwd: string;

  @Field()
  override cmd: string;

  @Field(() => [String])
  override args: readonly string[];

  @Field(() => SpawnTaskMode)
  readonly mode: SpawnTaskMode;

  private readonly _watchOn: WatchTask[] = [];

  // Constructor
  constructor(cwd: string, cmd: string, args: readonly string[], mode: SpawnTaskMode, opts?: SpawnTaskOption) {
    super(cmd, args, { ...opts, cwd });

    // Generate task id
    this.id = WatchTask.generateId(cwd, cmd, args);
    this.mode = mode;
  }

  // Statics
  static generateId(cwd: string, cmd: string, args: readonly string[]): string {
    let hash = createHash('md5')
      .update(path.resolve(cwd))
      .update(cmd);

    for (const arg of args) {
      hash = hash.update(arg);
    }

    return hash.digest('hex');
  }

  // Methods
  watch(task: WatchTask): void {
    if (['blocked', 'ready'].includes(this.status)) {
      this._watchOn.push(task);
    } else {
      throw Error(`Cannot add a watch deps to a ${this.status} task`);
    }
  }

  // Properties
  @Field(() => WatchTaskStatus)
  override get status(): WatchTaskStatus {
    return super.status as WatchTaskStatus;
  }

  @Field(() => [WatchTask], { description: 'Tasks watched by this task' })
  get watchOn(): readonly WatchTask[] {
    return this._watchOn;
  }
}
