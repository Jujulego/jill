import { FallbackGroup, GroupTask, SequenceGroup, Task, TaskManager } from '@jujulego/tasks';
import { Box } from 'ink';
import { useLayoutEffect, useMemo, useState } from 'react';

import { CONFIG } from '@/src/config/config-loader.ts';
import { container } from '@/src/inversify.config.ts';
import { isCommandCtx } from '@/src/tasks/command-task.ts';
import { isScriptCtx } from '@/src/tasks/script-task.ts';
import TaskSpinner from '@/src/ui/task-spinner.tsx';

// Types
export interface TaskTreeSpinnerProps {
  readonly manager: TaskManager;
}

// Utils
function comparator(a: Task, b: Task) {
  // 1 - compare workspaces
  const wksA = isScriptCtx(a.context) ? a.context.workspace.name : '';
  const wksB = isScriptCtx(b.context) ? b.context.workspace.name : '';
  const wksDiff = wksA.localeCompare(wksB);

  if (wksDiff !== 0) {
    return wksDiff;
  }

  // 2 - compare scripts
  const scriptA = isScriptCtx(a.context) ? a.context.script : '';
  const scriptB = isScriptCtx(b.context) ? b.context.script : '';

  return scriptA.localeCompare(scriptB);
}

function *extractTasks(groupId: string | undefined, tasks: readonly Task[], isVerbose: boolean, level = 0): Generator<{ task: Task, level: number }> {
  for (const task of tasks) {
    if (task.group?.id !== groupId) {
      continue;
    }

    yield { task, level };

    if (task instanceof GroupTask) {
      const isCommandGroup = task.tasks.some((t) => !isCommandCtx(t.context));
      const hasFailed = task.tasks.some((t) => t.status === 'failed');
      const isStarted = task.status === 'running';

      if (isVerbose || isCommandGroup || hasFailed || isStarted) {
        let tasks = task.tasks;

        if (!(task instanceof SequenceGroup || task instanceof FallbackGroup)) {
          tasks = [...tasks].sort(comparator);
        }

        yield* extractTasks(task.id, tasks, isVerbose, level + 1);
      }
    }
  }
}

// Component
export default function TaskTreeSpinner({ manager }: TaskTreeSpinnerProps) {
  // Config
  const isVerbose = useMemo(() => {
    const config = container.get(CONFIG);

    if (config.verbose) {
      return ['verbose', 'debug'].includes(config.verbose);
    } else {
      return false;
    }
  }, []);

  // Extract all tasks
  const [tasks, setTasks] = useState([...manager.tasks].sort(comparator));
  const [version, setVersion] = useState(0);

  const flat = useMemo(() => {
    return Array.from(extractTasks(undefined, tasks, isVerbose));
  }, [tasks, isVerbose, version]);

  useLayoutEffect(() => {
    let dirty = false;

    return manager.on('added', () => {
      if (!dirty) {
        dirty = true;

        queueMicrotask(() => {
          setTasks([...manager.tasks].sort(comparator));
          dirty = false;
        });
      }
    });
  }, [manager]);

  useLayoutEffect(() => {
    let dirty = false;

    return manager.on('started', () => {
      if (!dirty) {
        dirty = true;

        setTimeout(() => {
          setVersion((old) => ++old);
          dirty = false;
        });
      }
    });
  }, [manager]);

  useLayoutEffect(() => {
    return manager.on('completed', () => {
      setVersion((old) => ++old);
    });
  }, [manager]);

  // Render
  return (
    <Box flexDirection="column">
      { flat.map(({ task, level }) => (
        <Box key={task.id} marginLeft={level * 2}>
          <TaskSpinner task={task} />
        </Box>
      )) }
    </Box>
  );
}