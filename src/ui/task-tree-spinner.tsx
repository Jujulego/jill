import { TaskManager } from '@jujulego/tasks';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import symbols from 'log-symbols';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';

import { useStdoutDimensions } from '@/src/ui/hooks/useStdoutDimensions.ts';
import { useFlatTaskTree } from '@/src/ui/hooks/useFlatTaskTree.ts';
import TaskSpinner from '@/src/ui/task-spinner.tsx';

// Types
export interface TaskTreeSpinnerProps {
  readonly manager: TaskManager;
}

// Component
export default function TaskTreeSpinner({ manager }: TaskTreeSpinnerProps) {
  // Extract all tasks
  const [stats, setStats] = useState({ running: 0, done: 0, failed: 0 });
  const flat = useFlatTaskTree(manager);

  useLayoutEffect(() => {
    return manager.on('started', (task) => {
      setStats((old) => ({
        ...old,
        running: old.running + task.weight
      }));
    });
  }, [manager]);

  useLayoutEffect(() => {
    return manager.on('completed', (task) => {
      setStats((old) => ({
        running: old.running - task.weight,
        done: task.status === 'done' ? old.done + task.weight : old.done,
        failed: task.status === 'failed' ? old.failed + task.weight : old.failed,
      }));
    });
  }, [manager]);

  // Scroll
  const [start, setStart] = useState(0);

  const { rows: termHeight } = useStdoutDimensions();
  const maxHeight = useMemo(() => Math.min(termHeight - 4, flat.length), [termHeight, flat]);
  const slice = useMemo(() => flat.slice(start, start + maxHeight), [flat, start, maxHeight]);

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
        { (stats.running !== 0) && (
          <><Spinner type="sand" /> <Text bold>{ stats.running }</Text> running</>
        ) }
        { (stats.running !== 0 && stats.done !== 0) && (<>, </>) }
        { (stats.done !== 0) && (
          <><Text color="green">{ symbols.success } { stats.done } done</Text></>
        ) }
        { (stats.running + stats.done !== 0 && stats.failed !== 0) && (<>, </>) }
        { (stats.failed !== 0) && (
          <><Text color="red">{ symbols.error } { stats.failed } failed</Text></>
        ) }
        { (maxHeight < flat.length) && (<Text color="grey"> - use keyboard arrows to scroll</Text>) }
      </Text>
    </>
  );
}
