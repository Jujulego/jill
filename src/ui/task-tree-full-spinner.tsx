import { TaskManager } from '@jujulego/tasks';
import { Box, Text } from 'ink';

import { useFlatTaskTree } from '@/src/ui/hooks/useFlatTaskTree.js';
import TaskSpinner from '@/src/ui/task-spinner.jsx';
import TaskTreeStats from '@/src/ui/task-tree-stats.jsx';

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
