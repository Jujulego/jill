import type { TaskManager } from '@jujulego/tasks';
import { Box, Text } from 'ink';
import { useFlatTaskTree } from './hooks/useFlatTaskTree.js';
import TaskSpinner from '../cli/components/TaskSpinner.jsx';
import TaskTreeStats from './task-tree-stats.jsx';

// Component
export default function TaskTreeFullSpinner({ manager, verbose }: TaskTreeFullSpinnerProps) {
  const flat = useFlatTaskTree(manager, verbose);

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

// Types
export interface TaskTreeFullSpinnerProps {
  readonly manager: TaskManager;
  readonly verbose?: boolean;
}
