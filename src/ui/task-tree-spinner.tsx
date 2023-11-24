import { GroupTask, Task, TaskManager } from '@jujulego/tasks';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import symbols from 'log-symbols';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';

import { CONFIG } from '@/src/config/config-loader.ts';
import { container } from '@/src/inversify.config.ts';
import { Workspace } from '@/src/project/workspace.ts';
import { CommandTask, isCommandCtx } from '@/src/tasks/command-task.ts';
import { ScriptTask } from '@/src/tasks/script-task.ts';
import TaskSpinner from '@/src/ui/task-spinner.tsx';
import { useStdoutDimensions } from '@/src/utils/hooks.ts';

// Types
export interface TaskTreeSpinnerProps {
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
  const [stats, setStats] = useState({ running: 0, done: 0, failed: 0 });
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

    return manager.on('started', (task) => {
      setStats((old) => ({
        ...old,
        running: old.running + task.weight
      }));

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
    return manager.on('completed', (task) => {
      setStats((old) => ({
        running: old.running - task.weight,
        done: task.status === 'done' ? old.done + task.weight : old.done,
        failed: task.status === 'failed' ? old.failed + task.weight : old.failed,
      }));
      setVersion((old) => ++old);
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
