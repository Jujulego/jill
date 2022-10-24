import { GroupTask, TaskManager } from '@jujulego/tasks';
import { FC, useLayoutEffect, useState } from 'react';

import { TaskSpinner } from './task-spinner';
import { GroupTaskSpinner } from './group-task-spinner';

// Types
export interface TasksSpinnerProps {
  manager: TaskManager;
}

// Components
export const TaskManagerSpinner: FC<TasksSpinnerProps> = ({ manager }) => {
  const [tasks, setTasks] = useState(manager.tasks.filter((tsk) => !tsk.context.groupTask));

  useLayoutEffect(() => {
    let dirty = false;

    return manager.subscribe('added', () => {
      if (!dirty) {
        dirty = true;

        queueMicrotask(() => {
          setTasks(manager.tasks.filter((tsk) => !tsk.context.groupTask));
          dirty = false;
        });
      }
    });
  }, [manager]);

  return (
    <>
      { tasks.map((task) =>
        (task instanceof GroupTask) ? (
          <GroupTaskSpinner key={task.id} group={task} />
        ) : (
          <TaskSpinner key={task.id} task={task} />
        )
      ) }
    </>
  );
};
