import { IResolvers } from '@graphql-tools/utils';

import { logger } from '../logger';
import { ISpawnArgs, ITask, ITaskArgs } from './task.model';
import { WatchTask } from './watch-task';

// Constants
const tasks = new Map<string, WatchTask>();

// Resolvers
export const TasksResolvers: IResolvers = {
  Query: {
    task(_, { id }: ITaskArgs): ITask | undefined {
      return tasks.get(id)?.toPlain();
    },
    tasks(): ITask[] {
      return Array.from(tasks.values()).map(tsk => tsk.toPlain());
    },
  },
  Mutation: {
    spawn(_, args: ISpawnArgs): ITask {
      const id = WatchTask.generateTaskId(args.cmd, args.cwd);
      let task = tasks.get(id);

      if (!task || ['ready', 'running'].includes(task.status)) {
        task = new WatchTask(args.cmd, args.args, {
          cwd: args.cwd,
          logger: logger.child({ task: id })
        });
        tasks.set(id, task);
        task.start();

        logger.info(`Started new task ${task.id}`);
      }

      return task;
    },
    kill(_, { id }: ITaskArgs): ITask | undefined {
      const task = tasks.get(id);

      if (task) {
        task.stop();
        logger.info(`Stopped task ${task.id}`);

        return task.toPlain();
      }
    }
  }
};
