import { type TaskSet } from '@jujulego/tasks';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, type DOMElement, measureElement, Text, useApp, useInput } from 'ink';

import TaskName from '@/src/ui/task-name';
import { extractAllTasks } from '@/src/utils/tasks';

// Types
export interface TaskGraphProps {
  set: TaskSet;
}

// Component
export default function TaskGraph({ set }: TaskGraphProps) {
  // State
  const [selected, setSelected] = useState(0);
  const [width, setWidth] = useState(0);

  // Refs
  const container = useRef<DOMElement>(null);

  // Memos
  const tasks = useMemo(() => Array.from(extractAllTasks(set.tasks)), [set]);
  const sorted = useMemo(() => {
    const cache = new Map<string, number>();
    return tasks.sort((a, b) => a.complexity(cache) - b.complexity(cache));
  }, [tasks]);

  const targets = useMemo(() => sorted.filter((task) => set.tasks.includes(task)), [set, sorted]);

  const selectedDeps = useMemo(() => {
    const deps = new Set<string>();
    const queue = [targets[selected]];

    while (queue.length) {
      const task = queue.pop()!;

      if (deps.has(task.id)) {
        continue;
      }

      deps.add(task.id);
      queue.unshift(...task.dependencies);
    }

    return deps;
  }, [selected, targets]);

  // Effects
  useEffect(() => {
    if (container.current) {
      const size = measureElement(container.current);
      setWidth(size.width);
    }
  }, []);

  // Interact
  const { exit } = useApp();

  useInput((input, key) => {
    if (input === 'q') {
      exit();
    }

    if (key.downArrow) {
      setSelected((selected + 1) % targets.length);
    } else if (key.upArrow) {
      setSelected((selected + targets.length - 1) % targets.length);
    }
  });

  // Render
  return (
    <Box ref={container} flexDirection="column">
      { sorted.map((task) => (
        <Box key={task.id}>
          <Box width={4} justifyContent="flex-end">
            { set.tasks.includes(task) && (
              <Text color={task.id === targets[selected].id ? undefined : 'grey'}>&gt; </Text>
            ) }
            <Text color="grey">| </Text>
          </Box>
          <Text inverse={task.id === targets[selected].id} color={selectedDeps.has(task.id) ? undefined : 'grey'}>
            <TaskName task={task} />
          </Text>
        </Box>
      )) }
      <Text color="grey">{'-'.repeat(width)}</Text>
      <Box>
        <Text>q: Quit</Text>
      </Box>
    </Box>
  );
}
