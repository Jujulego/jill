import { GroupTask } from '@jujulego/tasks';
import { Box } from 'ink';
import { Fragment, useLayoutEffect, useState } from 'react';

import TaskSpinner from './task-spinner.tsx';

// Types
export interface GroupTaskSpinnerProps {
  group: GroupTask;
}

// Components
export default function GroupTaskSpinner({ group }: GroupTaskSpinnerProps) {
  // State
  const [status, setStatus] = useState(group.status);
  const [tasks, setTasks] = useState([...group.tasks]);

  // Effects
  useLayoutEffect(() => {
    return group.on('status', (event) => {
      setStatus(event.status);
    });
  }, [group]);

  useLayoutEffect(() => {
    let dirty = false;

    return group.on('task.added', () => {
      if (!dirty) {
        dirty = true;

        queueMicrotask(() => {
          setTasks([...group.tasks]);
          dirty = false;
        });
      }
    });
  }, [group]);

  // Render
  return (
    <>
      <TaskSpinner task={group} />
      { status != 'done' && (
        <Box flexDirection="column" marginLeft={2}>
          { tasks.map((task) => (
            <Fragment key={task.id}>
              { (task instanceof GroupTask) ? (
                <GroupTaskSpinner group={task} />
              ) : (
                <TaskSpinner task={task} />
              ) }
            </Fragment>
          )) }
        </Box>
      ) }
    </>
  );
}
