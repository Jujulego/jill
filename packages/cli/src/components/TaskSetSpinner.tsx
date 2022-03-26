import { Task, TaskSet } from '@jujulego/jill-core';
import { TaskSpinner } from '@jujulego/jill-common';
import { FC, useEffect, useState } from 'react';

// Types
export interface TaskSetSpinnerProps {
  taskSet: TaskSet;
}

// Component
export const TaskSetSpinner: FC<TaskSetSpinnerProps> = (props) => {
  const { taskSet } = props;

  // State
  const [tasks, setTasks] = useState<Task[]>([]);

  // Effects
  useEffect(() => {
    const handler = (task: Task) => {
      setTasks((old) => [...old, task]);
    };

    taskSet.on('started', handler);

    return () => {
      taskSet.off('started', handler);
    };
  }, [taskSet]);

  // Render
  return (
    <>
      { tasks.map((task, idx) => <TaskSpinner key={idx} task={task} />) }
    </>
  );
};
