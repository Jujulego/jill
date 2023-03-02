import { GroupTask, type TaskManager } from '@jujulego/tasks';
import { useLayoutEffect, useState } from 'react';

import GroupTaskSpinner from './group-task-spinner.jsx';
import TaskSpinner from './task-spinner.jsx';

// Types
export interface TasksSpinnerProps {
  manager: TaskManager;
}

// Components
export default function TaskManagerSpinner({ manager }: TasksSpinnerProps) {
  const [tasks, setTasks] = useState(manager.tasks.filter((tsk) => !tsk.group));

  useLayoutEffect(() => {
    let dirty = false;

    return manager.subscribe('added', () => {
      if (!dirty) {
        dirty = true;

        queueMicrotask(() => {
          setTasks(manager.tasks.filter((tsk) => !tsk.group));
          dirty = false;
        });
      }
    });
  }, [manager]);

  return (
    <>
      {tasks.map((task) =>
        (task instanceof GroupTask) ? (
          <GroupTaskSpinner key={task.id} group={task}/>
        ) : (
          <TaskSpinner key={task.id} task={task}/>
        )
      )}
    </>
  );
}
