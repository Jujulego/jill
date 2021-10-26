import { ITask, TaskStatus } from './task.model';

// Constants
const tasks: ITask[] = [
  {
    cmd: 'test',
    args: [],
    cwd: '/project/test',
    status: TaskStatus.running
  }
];

// Resolvers
export const TasksResolvers = {
  Query: {
    tasks() {
      return tasks;
    }
  }
};
