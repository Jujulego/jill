import { Task, TaskContext } from '@jujulego/tasks';
import { Text } from 'ink';
import Spinner from 'ink-spinner';
import symbols from 'log-symbols';
import { FC, useLayoutEffect, useMemo, useState } from 'react';

import { WorkspaceContext } from '../project';
import { waitForEvent } from '@jujulego/event-tree';

// Types
export interface TaskSpinnerProps {
  task: Task;
}

// Utils
function isWorkspaceCtx(ctx: Readonly<TaskContext>): ctx is Readonly<WorkspaceContext> {
  return 'workspace' in ctx;
}

// Components
export const TaskSpinner: FC<TaskSpinnerProps> = ({ task }) => {
  // State
  const [status, setStatus] = useState(task.status);
  const [time, setTime] = useState(0);

  // Memos
  const label = useMemo(() => {
    const ctx = task.context;

    if (isWorkspaceCtx(ctx)) {
      return `in ${ctx.workspace.name}`;
    }

    return null;
  }, [task]);

  // Effects
  useLayoutEffect(() => {
    return task.subscribe('status', (event) => {
      setStatus(event.status);
    });
  }, [task]);

  useLayoutEffect(() => {
    const ctrl = new AbortController();

    (async () => {
      try {
        if (['blocked', 'ready']?.includes(task.status)) {
          await waitForEvent(task, 'status.running', { signal: ctrl.signal });
        }

        const start = Date.now();

        if (task.status === 'running') {
          await Promise.race([
            waitForEvent(task, 'status.done', { signal: ctrl.signal }),
            waitForEvent(task, 'status.failed', { signal: ctrl.signal })
          ]);
        }

        setTime(Date.now() - start);
      } catch (err) {
        if (err) {
          throw err;
        }
      }
    })();

    return () => ctrl.abort();
  }, [task]);

  // Render
  switch (status) {
    case 'blocked':
    case 'ready':
      return (
        <Text color="grey">
          <Spinner type="line2" />{ ' ' + task.name }
          { label && <Text color="grey">{ ' ' + label }</Text> }
        </Text>
      );

    case 'running':
      return (
        <Text>
          <Spinner />{ ' ' + task.name }
          { label && <Text color="grey">{ ' ' + label }</Text> }
        </Text>
      );

    case 'done':
      return (
        <Text>
          <Text color="green">{ symbols.success } { task.name }</Text>
          { label && <Text color="grey">{ ' ' + label }</Text> }
          <Text color="magenta">{' '}took { time }ms</Text>
        </Text>
      );

    case 'failed':
      return (
        <Text>
          <Text color="red">{ symbols.error } { task.name }</Text>
          { label && <Text color="grey">{ ' ' + label }</Text> }
          <Text color="magenta">{' '}took { time }ms</Text>
        </Text>
      );
  }
};
