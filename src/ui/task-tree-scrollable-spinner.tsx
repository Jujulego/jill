import { TaskManager } from '@jujulego/tasks';
import { Box, Text, useInput } from 'ink';
import { useEffect, useMemo, useState } from 'react';

import { useStdoutDimensions } from '@/src/ui/hooks/useStdoutDimensions.ts';
import { useFlatTaskTree } from '@/src/ui/hooks/useFlatTaskTree.ts';
import TaskSpinner from '@/src/ui/task-spinner.tsx';
import TaskTreeStats from '@/src/ui/task-tree-stats.tsx';

// Types
export interface TaskTreeScrollableSpinnerProps {
  readonly manager: TaskManager;
}

// Component
export default function TaskTreeScrollableSpinner({ manager }: TaskTreeScrollableSpinnerProps) {
  const { rows: termHeight } = useStdoutDimensions();

  // Extract all tasks
  const flat = useFlatTaskTree(manager);

  const maxHeight = useMemo(
    () => Math.min(termHeight - 4, flat.length),
    [termHeight, flat]
  );

  // Manage scroll
  const [start, setStart] = useState(0);

  const slice = useMemo(
    () => flat.slice(start, start + maxHeight),
    [flat, start, maxHeight]
  );

  useEffect(() => {
    if (start + maxHeight > flat.length) {
      setStart(Math.max(flat.length - maxHeight, 0));
    }
  }, [start, flat, maxHeight]);

  useInput((_, key) => {
    if (key.upArrow) {
      setStart((old) => Math.max(0, old - 1));
    } else if (key.downArrow) {
      setStart((old) => Math.min(flat.length - maxHeight, old + 1));
    }
  });

  // Render
  return (
    <>
      <Box flexDirection="column">
        { slice.map(({ task, level }) => (
          <Box key={task.id} marginLeft={level * 2} flexShrink={0}>
            <TaskSpinner task={task} />
          </Box>
        )) }
      </Box>
      <Text>
        <TaskTreeStats manager={manager} />
        { (maxHeight < flat.length) && (<Text color="grey"> - use keyboard arrows to scroll</Text>) }
      </Text>
    </>
  );
}
