import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { SpawnTask, SpawnTaskOption } from '@jujulego/jill-core';
import { createHash } from 'crypto';
import path from 'path';

import { IWatchTask, WatchTaskStatus } from '../../common/watch-task.model';

// Enums
registerEnumType(WatchTaskStatus, {
  name: 'WatchTaskStatus',
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

  @Field(() => [WatchTask], { description: 'Tasks watched by this task' })
  watchOn: WatchTask[] = [];

  // Constructor
  constructor(cwd: string, cmd: string, args: readonly string[], opts?: SpawnTaskOption) {
    super(cmd, args, { ...opts, cwd });

    // Generate task id
    this.id = WatchTask.generateId(cwd, cmd, args);
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

  // Properties
  @Field(() => WatchTaskStatus)
  override get status(): WatchTaskStatus {
    return super.status as WatchTaskStatus;
  }
}
