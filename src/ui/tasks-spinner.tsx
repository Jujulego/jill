import { TaskManager } from '@jujulego/tasks';
import { FC } from 'react';

import { TaskSpinner } from './task-spinner';

// Types
export interface TasksSpinnerProps {
  manager: TaskManager;
}

// Components
export const TasksSpinner: FC<TasksSpinnerProps> = ({ manager }) => (
  <>
    { manager.tasks.map((task, idx) => (
      <TaskSpinner key={idx} task={task}/>
    )) }
  </>
);
