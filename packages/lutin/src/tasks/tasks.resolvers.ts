import { IResolvers } from '@graphql-tools/utils';

import { ISpawnArgs, ITask, ITaskArgs } from './task.model';
import { WatchTask } from './watch-task';

// Constants
const tasks = new Map<string, WatchTask>();

// Resolvers
export const TasksResolvers: IResolvers = {
  Query: {
    task(_, { id }: ITaskArgs) {
      return tasks.get(id)?.toPlain();
    },
    tasks() {
      return Array.from(tasks.values()).map(tsk => tsk.toPlain());
    },
  },
  Mutation: {
    spawn(_, args: ISpawnArgs): ITask {
      let task = new WatchTask(args.cmd, args.args, { cwd: args.cwd });
      const stored = tasks.get(task.id);

      if (stored) {
        task = stored;
      } else {
        tasks.set(task.id, task);
      }

      return task;
    }
  }
};
