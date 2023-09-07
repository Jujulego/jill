import { GroupTask } from '@jujulego/tasks';
import { Box } from 'ink';
import { Fragment, useLayoutEffect, useMemo, useState } from 'react';

import { CONFIG } from '@/src/config/config-loader.ts';
import { container } from '@/src/inversify.config.ts';
import { isCommandCtx } from '@/src/tasks/command-task.ts';

import TaskSpinner from './task-spinner.tsx';

// Types
export interface GroupTaskSpinnerProps {
  group: GroupTask;
}

// Components
export default function GroupTaskSpinner({ group }: GroupTaskSpinnerProps) {
  // State
  const [verbose, setVerbose] = useState(false);
  const [status, setStatus] = useState(group.status);
  const [tasks, setTasks] = useState([...group.tasks]);

  // Memo
  const isReduced = useMemo(() => !verbose && status == 'done' && tasks.every((tsk) => isCommandCtx(tsk.context)), [verbose, status, tasks]);

  // Effects
  useLayoutEffect(() => {
    const config = container.get(CONFIG);

    if (config.verbose) {
      setVerbose(['verbose', 'debug'].includes(config.verbose));
    }
  }, []);

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
      { isReduced || (
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
