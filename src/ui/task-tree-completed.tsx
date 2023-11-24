import { GroupTask, Task, TaskManager } from '@jujulego/tasks';
import { Box, Static } from 'ink';
import { useMemo } from 'react';

import { CONFIG } from '@/src/config/config-loader.ts';
import { container } from '@/src/inversify.config.ts';
import { Workspace } from '@/src/project/workspace.ts';
import { CommandTask, isCommandCtx } from '@/src/tasks/command-task.ts';
import { ScriptTask } from '@/src/tasks/script-task.ts';
import TaskSpinner from '@/src/ui/task-spinner.tsx';

// Types
export interface TaskTreeCompletedProps {
  readonly manager: TaskManager;
}

// Utils
function comparator(a: Task, b: Task) {
  // 1 - compare kind
  const kindA = a instanceof CommandTask ? 0 : 1;
  const kindB = b instanceof CommandTask ? 0 : 1;

  if (kindA !== kindB) {
    return kindB - kindA;
  }

  // 2 - compare workspaces
  const wksA = 'workspace' in a.context ? (a.context.workspace as Workspace).name : '\uffff';
  const wksB = 'workspace' in b.context ? (b.context.workspace as Workspace).name : '\uffff';
  const wksDiff = wksA.localeCompare(wksB);

  if (wksDiff !== 0) {
    return wksDiff;
  }

  // 1 - compare scripts
  const scriptA = 'script' in a.context ? a.context.script as string : '\uffff';
  const scriptB = 'script' in b.context ? b.context.script as string : '\uffff';

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

        if (task instanceof ScriptTask) {
          tasks = [...tasks].sort(comparator);
        }

        yield* extractTasks(task.id, tasks, isVerbose, level + 1);
      }
    }
  }
}

// Component
export default function TaskTreeCompleted({ manager }: TaskTreeCompletedProps) {
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
  const flat = useMemo(() => {
    return Array.from(extractTasks(undefined, [...manager.tasks].sort(comparator), isVerbose));
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
