import { TaskManager } from '@jujulego/tasks';
import { Box, Text } from 'ink';

import { useFlatTaskTree } from '@/src/ui/hooks/useFlatTaskTree.ts';
import TaskSpinner from '@/src/ui/task-spinner.tsx';
import TaskTreeStats from '@/src/ui/task-tree-stats.tsx';

// Types
export interface TaskTreeFullSpinnerProps {
  readonly manager: TaskManager;
}

// Component
export default function TaskTreeFullSpinner({ manager }: TaskTreeFullSpinnerProps) {
  const flat = useFlatTaskTree(manager);

  // Render
  return (
    <>
      <Box flexDirection="column">
        { flat.map(({ task, level }) => (
          <Box key={task.id} marginLeft={level * 2} flexShrink={0}>
            <TaskSpinner task={task} />
          </Box>
        )) }
      </Box>
      <Text>
        <TaskTreeStats manager={manager} />
      </Text>
    </>
  );
}
