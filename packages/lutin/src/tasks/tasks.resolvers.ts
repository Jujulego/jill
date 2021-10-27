import { IResolvers } from '@graphql-tools/utils';
import { createHash } from 'crypto';

import { ISpawnArgs, ITask, ITaskArgs, TaskStatus } from './task.model';

// Constants
const tasks = new Map<string, ITask>();

// Utils
function generateId(args: ISpawnArgs): string {
  return createHash('md5').update(args.cwd).update(args.cmd).digest('hex');
}

// Resolvers
export const TasksResolvers: IResolvers = {
  Query: {
    task(_, { id }: ITaskArgs) {
      return tasks.get(id);
    },
    tasks() {
      return tasks.values();
    },
  },
  Mutation: {
    spawn(_, args: ISpawnArgs): ITask {
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
