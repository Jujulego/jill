import { type Task, type TaskSet } from '@jujulego/tasks';
import { useMemo, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';

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

  // Memos
  const tasks = useMemo(() => Array.from(extractAllTasks(set.tasks)), [set]);
  const sorted = useMemo(() => {
    const cache = new Map<string, number>();
    return tasks.sort((a, b) => a.complexity(cache) - b.complexity(cache));
  }, [tasks]);

  const targets = useMemo(() => sorted.filter((task) => set.tasks.includes(task)), [set, sorted]);

  const selectedDeps = useMemo(() => {
    const deps = new Map<string, number>();
    const queue = [[targets[selected], 0] as [task: Task, level: number]];

    while (queue.length) {
      const [task, lvl] = queue.pop()!;

      if (!deps.has(task.id)) {
        for (const tsk of task.dependencies) {
          queue.unshift([tsk, lvl + 1]);
        }
      }

      deps.set(task.id, Math.max(lvl, deps.get(task.id) ?? 0));
    }

    return deps;
  }, [selected, targets]);

  const maxLevel = useMemo(() => Math.max(...selectedDeps.values()), [selectedDeps]);

  // Interact
  const { exit } = useApp();

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
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
    <>
      { sorted.map((task) => (
        <Box key={task.id}>
          <Text color={selectedDeps.has(task.id) ? undefined : 'grey'}>
            <Text>{ set.tasks.includes(task) ? '>' : ' '} | </Text>
            <Text>{' '.repeat(maxLevel - (selectedDeps.get(task.id) ?? 0))}</Text>
            <TaskName task={task} />
          </Text>
        </Box>
      )) }
    </>
  );
}
