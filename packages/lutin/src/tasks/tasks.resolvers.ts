import { ITask, TaskStatus } from './task.model';

// Constants
const tasks: ITask[] = [
  {
    id: 'mock-1',
    cmd: 'test',
    args: [],
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
