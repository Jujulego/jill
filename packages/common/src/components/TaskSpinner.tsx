import { Task } from '@jujulego/jill-core';
import { Text } from 'ink';
import Spinner from 'ink-spinner';
import logSymbols from 'log-symbols';
import { FC, useEffect, useState } from 'react';
import { WorkspaceName } from './WorkspaceName';

// Types
export interface TaskSpinnerProps {
  task: Task;
}

// Component
export const TaskSpinner: FC<TaskSpinnerProps> = (props) => {
  const { task } = props;
  const wks = task.context.workspace;

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
        { logSymbols.success }{' '}
        { wks && <><Text color="grey">[<WorkspaceName workspace={wks} />]</Text>{' '}</> }
        { task.name } is { status }
      </Text>
    );
  } else if (status === 'failed') {
    return (
      <Text>
        { logSymbols.error }{' '}
        { wks && <><Text color="grey">[<WorkspaceName workspace={wks} />]</Text>{' '}</> }
        { task.name } is { status }
      </Text>
    );
  }

  return (
    <Text>
      <Spinner type={status === 'running' ? 'line' : 'simpleDotsScrolling'} />{' '}
      { wks && <><Text color="grey">[<WorkspaceName workspace={wks} />]</Text>{' '}</> }
      { task.name } is { status }
    </Text>
  );
};
