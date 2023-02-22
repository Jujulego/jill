import { type Task } from '@jujulego/tasks';
import { Text } from 'ink';
import Spinner from 'ink-spinner';
import symbols from 'log-symbols';
import ms from 'pretty-ms';
import { useLayoutEffect, useState } from 'react';

import TaskName from './task-name';

// Types
export interface TaskSpinnerProps {
  task: Task;
}

// Components
export default function TaskSpinner({ task }: TaskSpinnerProps) {
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
    return task.subscribe('completed', ({ duration }) => {
      setTime(duration);
    });
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
          <Spinner />{' '}<TaskName task={task}/>
        </Text>
      );

    case 'done':
      return (
        <Text>
          <Text color="green">{symbols.success}{' '}<TaskName task={task} /></Text>
          <Text color="magenta">{' '}(took {ms(time)})</Text>
        </Text>
      );

    case 'failed':
      return (
        <Text>
          <Text color="red">{symbols.error}{' '}<TaskName task={task} /></Text>
          <Text color="magenta">{' '}(took {ms(time)})</Text>
        </Text>
      );
  }
}
