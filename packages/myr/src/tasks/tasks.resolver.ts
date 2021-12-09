import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { SpawnArgs, Task, TaskArgs } from './task.model';
import { WatchManager } from './watch-manager';

// Resolver
@Resolver(() => Task)
export class TasksResolver {
  // Constructor
  constructor(
    private readonly manager: WatchManager
  ) {}

  // Queries
  @Query(() => Task, { nullable: true })
  task(@Args() { id }: TaskArgs): Task | undefined {
    return this.manager.get(id)?.toPlain();
  }

  @Query(() => [Task])
  tasks(): Task[] {
    return this.manager.tasks.map(tsk => tsk.toPlain());
  }

  // Mutations
  @Mutation(() => Task)
  spawn(@Args() { cwd, cmd, args }: SpawnArgs): Task {
    return this.manager.spawn(cwd, cmd, args).toPlain();
  }

  @Mutation(() => Task, { nullable: true })
  async kill(@Args() { id }: TaskArgs): Promise<Task | undefined> {
    const task = await this.manager.kill(id);
    return task?.toPlain();
  }
}
