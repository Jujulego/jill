import { TaskManager } from '@jujulego/tasks';
import { FC, useLayoutEffect, useState } from 'react';

import { TaskSpinner } from './task-spinner';

// Types
export interface TasksSpinnerProps {
  manager: TaskManager;
}

// Components
export const TasksSpinner: FC<TasksSpinnerProps> = ({ manager }) => {
  const [tasks, setTasks] = useState([...manager.tasks]);

  useLayoutEffect(() => {
    let dirty = false;

    return manager.subscribe('added', () => {
      if (!dirty) {
        dirty = true;

        queueMicrotask(() => {
          setTasks([...manager.tasks]);
          dirty = false;
        });
      }
    });
  }, [manager]);

  return (
    <>
      { tasks.map((task) => (
        <TaskSpinner key={task.id} task={task}/>
      )) }
    </>
  );
};
