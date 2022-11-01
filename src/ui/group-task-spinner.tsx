import { GroupTask } from '@jujulego/tasks';
import { Box } from 'ink';
import { FC, useLayoutEffect, useState } from 'react';

import { TaskSpinner } from './task-spinner';

// Types
export interface GroupTaskSpinnerProps {
  group: GroupTask;
}

// Components
export const GroupTaskSpinner: FC<GroupTaskSpinnerProps> = ({ group }) => {
  const [tasks, setTasks] = useState([...group.tasks]);

  useLayoutEffect(() => {
    let dirty = false;

    return group.subscribe('task.added', () => {
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
          <Box key={task.id}>
            { (task instanceof GroupTask) ? (
              <GroupTaskSpinner group={task} />
            ) : (
              <TaskSpinner task={task} />
            ) }
          </Box>
        )) }
      </Box>
    </>
  );
};
