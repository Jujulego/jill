import { ValidationPipe } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { SpawnTaskArgs } from './spawn-task.args';
import { TaskIDArgs } from './task-id.args';
import { WatchManager } from './watch-manager.service';
import { WatchTask } from './watch-task.model';

// Resolver
@Resolver(() => WatchTask)
export class TasksResolver {
  // Constructor
  constructor(
    private readonly manager: WatchManager
  ) {}

  // Queries
  @Query(() => WatchTask, { nullable: true })
  task(@Args(ValidationPipe) { id }: TaskIDArgs): WatchTask | null {
    return this.manager.get(id);
  }

  @Query(() => [WatchTask])
  tasks(): readonly WatchTask[] {
    return this.manager.tasks;
  }

  // Mutations
  @Mutation(() => WatchTask)
  spawn(@Args(ValidationPipe) { cwd, cmd, args }: SpawnTaskArgs): WatchTask {
    return this.manager.spawn(cwd, cmd, args);
  }

  @Mutation(() => WatchTask, { nullable: true })
  async kill(@Args(ValidationPipe) { id }: TaskIDArgs): Promise<WatchTask | null> {
    return await this.manager.kill(id);
  }
}
