import { GroupTask, type Task, type TaskManager } from '@jujulego/tasks';
import { useLayoutEffect, useMemo, useState } from 'react';
import type { Workspace } from '../../projects/workspace.js';
import { CommandTask, isCommandCtx } from '../../tasks/command-task.js';
import { ScriptTask } from '../../tasks/script-task.js';

// Types
export interface FlatTask {
  task: Task;
  level: number;
}

// Utils
/**
 * Sorts tasks according to workspace and script, keeping command at the end
 */
export function taskComparator(a: Task, b: Task) {
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

/**
 * Extract tasks to be printed, with their level in the tree
 */
export function* flatTasks(tasks: readonly Task[], isVerbose: boolean, groupId?: string, level = 0): Generator<FlatTask> {
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
          tasks = [...tasks].sort(taskComparator);
        }

        yield* flatTasks(tasks, isVerbose, task.id, level + 1);
      }
    }
  }
}

// Hook
export function useFlatTaskTree(manager: TaskManager, isVerbose: boolean = false): FlatTask[] {
  const [tasks, setTasks] = useState([...manager.tasks].sort(taskComparator));
  const [version, setVersion] = useState(0);

  useLayoutEffect(() => {
    let dirty = false;

    return manager.events$.on('added', () => {
      if (!dirty) {
        dirty = true;

        queueMicrotask(() => {
          setTasks([...manager.tasks].sort(taskComparator));
          dirty = false;
        });
      }
    }).unsubscribe;
  }, [manager]);

  useLayoutEffect(() => {
    let dirty = false;

    return manager.events$.on('started', () => {
      if (!dirty) {
        dirty = true;

        setTimeout(() => {
          setVersion((old) => ++old);
          dirty = false;
        });
      }
    }).unsubscribe;
  }, [manager]);

  useLayoutEffect(() => {
    let dirty = false;

    return manager.events$.on('completed', () => {
      if (!dirty) {
        dirty = true;

        setTimeout(() => {
          setVersion((old) => ++old);
          dirty = false;
        });
      }
    }).unsubscribe;
  }, [manager]);

  return useMemo(() => {
    return Array.from(flatTasks(tasks, isVerbose));
  }, [tasks, isVerbose, version]); // eslint-disable-line react-hooks/exhaustive-deps
}
