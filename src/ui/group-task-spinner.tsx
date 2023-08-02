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
  const [tasks, setTasks] = useState([...group.tasks]);

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

  return (
    <>
      <TaskSpinner task={group} />
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
    </>
  );
}
