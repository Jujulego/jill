import { ISpawnArgs, ITask, TaskStatus } from './task.model';

// Constants
const tasks: ITask[] = [];

// Resolvers
export const TasksResolvers = {
  Query: {
    tasks(): ITask[] {
      return tasks;
    },
  },
  Mutation: {
    spawn(_: unknown, args: ISpawnArgs): ITask {
      const task: ITask = {
        cwd: args.cwd,
        cmd: args.cmd,
        args: args.args ?? [],
        status: TaskStatus.ready
      };

      tasks.push(task);
      return task;
    }
  }
};
