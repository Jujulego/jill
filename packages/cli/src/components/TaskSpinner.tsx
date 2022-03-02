import { Task } from '@jujulego/jill-core';
import { Text } from 'ink';
import Spinner from 'ink-spinner';
import logSymbols from 'log-symbols';
import { FC, useEffect, useState } from 'react';

// Types
export interface TaskSpinnerProps {
  task: Task;
}

// Component
export const TaskSpinner: FC<TaskSpinnerProps> = (props) => {
  const { task } = props;

  // State
  const [status, setStatus] = useState(task.status);

  // Effects
  useEffect(() => {
    task.on('status', setStatus);

    return () => {
      task.off('status', setStatus);
    };
  }, [task]);

  // Render
  if (status === 'done') {
    return (
      <Text>
        <Text color="green">{ logSymbols.success }</Text>{' '}
        <Text color="grey">[{ task.context.workspace?.name }]</Text>{' '}
        { task.name } is { status }
      </Text>
    );
  } else if (status === 'failed') {
    return (
      <Text>
        <Text color="red">{ logSymbols.error }</Text>{' '}
        <Text color="grey">[{ task.context.workspace?.name }]</Text>{' '}
        { task.name } is { status }
      </Text>
    );
  }

  return (
    <Text>
      <Spinner type={status === 'running' ? 'line' : 'simpleDotsScrolling'} />{' '}
      <Text color="grey">[{ task.context.workspace?.name }]</Text>{' '}
      { task.name } is { status }
    </Text>
  );
};
