import type { TaskManager } from '@jujulego/tasks';
import { Box, Static } from 'ink';
import { useMemo } from 'react';
import { flatTasks, taskComparator } from './hooks/useFlatTaskTree.js';
import TaskSpinner from './task-spinner.jsx';
import TaskTreeStats from './task-tree-stats.jsx';

// Component
export default function TaskTreeCompleted({ manager, verbose }: TaskTreeCompletedProps) {
  // Extract all tasks
  const flat = useMemo(() => {
    return Array.from(flatTasks([...manager.tasks].sort(taskComparator), verbose ?? false));
  }, [manager, verbose]);

  // Render
  return (
    <>
      <Static items={flat}>
        { ({ task, level }) => (
          <Box key={task.id} marginLeft={level * 2} flexShrink={0}>
            <TaskSpinner task={task} />
          </Box>
        ) }
      </Static>
      <TaskTreeStats manager={manager} />
    </>
  );
}

// Types
export interface TaskTreeCompletedProps {
  readonly manager: TaskManager;
  readonly verbose?: boolean;
}
