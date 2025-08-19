import { type Task } from '@jujulego/tasks';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import ms from 'pretty-ms';
import { useLayoutEffect, useState } from 'react';
import { isCommandCtx } from '../../tasks/command-task.js';
import { isScriptCtx } from '../../tasks/script-task.js';
import * as symbols from '../../utils/symbols.js';
import TaskName from './TaskName.jsx';

// Types
export interface TaskSpinnerProps {
  task: Task;
}

// Components
export default function TaskSpinner({ task }: TaskSpinnerProps) {
  // State
  const [status, setStatus] = useState(task.status);
  const [time, setTime] = useState(task.duration);

  // Effects
  useLayoutEffect(() => {
    return task.events$.on('status', (event) => {
      setStatus(event.status);
    }).unsubscribe;
  }, [task]);

  useLayoutEffect(() => {
    return task.events$.on('completed', ({ duration }) => {
      setTime(duration);
    }).unsubscribe;
  }, [task]);

  // Render
  const isScriptChild = (isCommandCtx(task.context) && task.group && isScriptCtx(task.group.context)) ?? false;

  switch (status) {
    case 'blocked':
    case 'ready':
    case 'starting':
      return (
        <Box>
          <Text color="grey">{'\u00B7'}</Text>
          <Box paddingLeft={1}>
            <Text color="grey" wrap="truncate">
              <TaskName task={task} withWorkspace />
            </Text>
          </Box>
        </Box>
      );

    case 'running':
      return (
        <Box>
          <Text dimColor={isScriptChild}>
            <Spinner />
          </Text>
          <Box paddingLeft={1}>
            <Text dimColor={isScriptChild} wrap="truncate">
              <TaskName task={task} withWorkspace />
            </Text>
          </Box>
        </Box>
      );

    case 'done':
      return (
        <Box>
          <Text color="green">{ symbols.success(true) }</Text>
          <Box>
            <Text dimColor={isScriptChild} wrap="truncate">
              <TaskName task={task} withWorkspace />
            </Text>
          </Box>
          <Box paddingLeft={1} flexShrink={0}>
            <Text color={isScriptChild ? 'grey' : 'dim'}>(took {ms(time)})</Text>
          </Box>
        </Box>
      );

    case 'failed':
      return (
        <Box>
          <Text color="red">{ symbols.error(true) }</Text>
          <Box>
            <Text dimColor={isScriptChild} wrap="truncate">
              <TaskName task={task} withWorkspace />
            </Text>
          </Box>
          <Box paddingLeft={1} flexShrink={0}>
            <Text color={isScriptChild ? 'grey' : 'dim'}>(took {ms(time)})</Text>
          </Box>
        </Box>
      );
  }
}
