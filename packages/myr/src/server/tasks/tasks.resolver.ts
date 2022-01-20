import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { SpawnArgs, TaskArgs } from './task.model';
import { WatchManager } from './watch-manager';
import { WatchTask } from './watch-task';

// Resolver
@Resolver(() => WatchTask)
export class TasksResolver {
  // Constructor
  constructor(
    private readonly manager: WatchManager
  ) {}

  // Queries
  @Query(() => WatchTask, { nullable: true })
  task(@Args() { id }: TaskArgs): WatchTask | null {
    return this.manager.get(id);
  }

  @Query(() => [WatchTask])
  tasks(): readonly WatchTask[] {
    return this.manager.tasks;
  }

  // Mutations
  @Mutation(() => WatchTask)
  spawn(@Args() { cwd, cmd, args }: SpawnArgs): WatchTask {
    return this.manager.spawn(cwd, cmd, args);
  }

  @Mutation(() => WatchTask, { nullable: true })
  async kill(@Args() { id }: TaskArgs): Promise<WatchTask | null> {
    return await this.manager.kill(id);
  }
}
