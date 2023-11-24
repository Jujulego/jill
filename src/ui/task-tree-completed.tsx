import { TaskManager } from '@jujulego/tasks';
import { Box, Static } from 'ink';
import { useMemo } from 'react';

import { flatTasks, taskComparator } from '@/src/ui/hooks/useFlatTaskTree.ts';
import { useIsVerbose } from '@/src/ui/hooks/useIsVerbose.ts';
import TaskSpinner from '@/src/ui/task-spinner.tsx';

// Types
export interface TaskTreeCompletedProps {
  readonly manager: TaskManager;
}

// Component
export default function TaskTreeCompleted({ manager }: TaskTreeCompletedProps) {
  // Config
  const isVerbose = useIsVerbose();

  // Extract all tasks
  const flat = useMemo(() => {
    return Array.from(flatTasks([...manager.tasks].sort(taskComparator), isVerbose));
  }, [manager, isVerbose]);

  // Render
  return (
    <Static items={flat}>
      { ({ task, level }) => (
        <Box key={task.id} marginLeft={level * 2} flexShrink={0}>
          <TaskSpinner task={task} />
        </Box>
      ) }
    </Static>
  );
}
