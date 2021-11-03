import { IResolvers } from '@graphql-tools/utils';

import { ISpawnArgs, ITask, ITaskArgs } from './task.model';
import { WatchManager } from './watch-manager';

// Constants
const manager = new WatchManager();

// Resolvers
export const TasksResolvers: IResolvers = {
  Query: {
    task(_, { id }: ITaskArgs): ITask | undefined {
      return manager.get(id)?.toPlain();
    },
    tasks(): ITask[] {
      return manager.tasks.map(tsk => tsk.toPlain());
    },
  },
  Mutation: {
    spawn(_, { cwd, cmd, args }: ISpawnArgs): ITask {
      return manager.spawn(cwd, cmd, args).toPlain();
    },
    kill(_, { id }: ITaskArgs): ITask | undefined {
      return manager.kill(id)?.toPlain();
    }
  }
};
