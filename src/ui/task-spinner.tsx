import { waitForEvent } from '@jujulego/event-tree';
import { Task } from '@jujulego/tasks';
import { Text } from 'ink';
import Spinner from 'ink-spinner';
import symbols from 'log-symbols';
import ms from 'ms';
import { FC, useLayoutEffect, useState } from 'react';

import { TaskName } from './task-name';

// Types
export interface TaskSpinnerProps {
  task: Task;
}

// Components
export const TaskSpinner: FC<TaskSpinnerProps> = ({ task }) => {
  // State
  const [status, setStatus] = useState(task.status);
  const [time, setTime] = useState(0);

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
          <Spinner type="line2" />{' '}<TaskName task={task} />
        </Text>
      );

    case 'running':
      return (
        <Text>
          <Spinner />{' '}<TaskName task={task} />
        </Text>
      );

    case 'done':
      return (
        <Text>
          <Text color="green">{ symbols.success }{' '}<TaskName task={task} /></Text>
          <Text color="magenta">{' '}took { ms(time) }</Text>
        </Text>
      );

    case 'failed':
      return (
        <Text>
          <Text color="red">{ symbols.error }{' '}<TaskName task={task} /></Text>
          <Text color="magenta">{' '}took { ms(time) }</Text>
        </Text>
      );
  }
};
