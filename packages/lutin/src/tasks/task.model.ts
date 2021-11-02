import { TaskStatus } from '@jujulego/jill-core';
import gql from 'graphql-tag';

// Models
export interface ITask {
  id: string;
  cwd: string;
  cmd: string;
  args: readonly string[];
  status: TaskStatus;
}

// Args
export interface ITaskArgs {
  id: string;
}

export interface ISpawnArgs {
  cwd: string;
  cmd: string;
  args: string[];
}

// Fragments
export const TaskFragment = gql`
    fragment Task on Task {
        id
        cwd
        cmd
        args
        status
    }
`;