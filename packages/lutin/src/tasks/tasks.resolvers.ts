import { createHash } from 'crypto';

import { ISpawnArgs, ITask, TaskStatus } from './task.model';

// Constants
const tasks = new Map<string, ITask>();

// Utils
function generateId(args: ISpawnArgs): string {
  return createHash('md5').update(args.cwd).update(args.cmd).digest('hex');
}

// Resolvers
export const TasksResolvers = {
  Query: {
    tasks() {
      return tasks.values();
    },
  },
  Mutation: {
    spawn(_: unknown, args: ISpawnArgs): ITask {
      const task: ITask = {
        id: generateId(args),
        cwd: args.cwd,
        cmd: args.cmd,
        args: args.args ?? [],
        status: TaskStatus.ready
      };

      tasks.set(task.id, task);
      return task;
    }
  }
};
