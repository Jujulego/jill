import { type Task } from '@jujulego/tasks';
import { Box, Text } from 'ink';
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
    return task.on('status', (event) => {
      setStatus(event.status);
    });
  }, [task]);

  useLayoutEffect(() => {
    return task.on('completed', ({ duration }) => {
      setTime(duration);
    });
  }, [task]);

  // Render
  switch (status) {
    case 'blocked':
    case 'ready':
      return (
        <Box>
          <Text color="grey"><Spinner type="line2" /></Text>
          <Box paddingLeft={1}>
            <Text color="grey" wrap="truncate"><TaskName task={task} /></Text>
          </Box>
        </Box>
      );

    case 'running':
      return (
        <Box>
          <Spinner />
          <Box paddingLeft={1}>
            <Text wrap="truncate"><TaskName task={task} /></Text>
          </Box>
        </Box>
      );

    case 'done':
      return (
        <Box>
          <Text color="green">{ symbols.success }</Text>
          <Box paddingLeft={1}>
            <Text wrap="truncate"><TaskName task={task} /></Text>
          </Box>
          <Box paddingLeft={1} flexShrink={0}>
            <Text color="magenta">(took {ms(time)})</Text>
          </Box>
        </Box>
      );

    case 'failed':
      return (
        <Box>
          <Text color="red">{ symbols.error }</Text>
          <Box paddingLeft={1}>
            <Text wrap="truncate"><TaskName task={task} /></Text>
          </Box>
          <Box paddingLeft={1} flexShrink={0}>
            <Text color="magenta">(took {ms(time)})</Text>
          </Box>
        </Box>
      );
  }
}
