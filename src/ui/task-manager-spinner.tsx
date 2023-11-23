import { GroupTask, Task, type TaskManager } from '@jujulego/tasks';
import { Box } from 'ink';
import { useLayoutEffect, useState } from 'react';

import GroupTaskSpinner from './group-task-spinner.tsx';
import TaskSpinner from './task-spinner.tsx';

// Types
export interface TasksSpinnerProps {
  manager: TaskManager;
}

// Utils
function taskPredicate(task: Task): boolean {
  if (task.group) {
    return false;
  }

  if ('hidden' in task.context && task.context.hidden) {
    return false;
  }

  return true;
}

// Components
export default function TaskManagerSpinner({ manager }: TasksSpinnerProps) {
  const [tasks, setTasks] = useState(manager.tasks.filter(taskPredicate));

  useLayoutEffect(() => {
    let dirty = false;

    return manager.on('added', () => {
      if (!dirty) {
        dirty = true;

        queueMicrotask(() => {
          setTasks(manager.tasks.filter(taskPredicate));
          dirty = false;
        });
      }
    });
  }, [manager]);

  return (
    <Box flexDirection="column" flexShrink={0}>
      { tasks.map((task) =>
        (task instanceof GroupTask) ? (
          <GroupTaskSpinner key={task.id} group={task} />
        ) : (
          <TaskSpinner key={task.id} task={task} />
        )
      ) }
    </Box>
  );
}
