import { GroupTask } from '@jujulego/tasks';
import { Box } from 'ink';
import { useLayoutEffect, useMemo, useState } from 'react';

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
  const [canReduce, setCanReduce] = useState(true);

  // Memo
  const forceExtended = useMemo(() => verbose || tasks.some((tsk) => !isCommandCtx(tsk.context)), [verbose, tasks]);
  const isReduced = useMemo(() => !forceExtended && canReduce, [forceExtended, canReduce]);

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

  useLayoutEffect(() => {
    if (status === 'running') {
      setCanReduce(false);
    } else if (status === 'done') {
      setCanReduce(true);
    }
  }, [status]);

  // Render
  return (
    <>
      <TaskSpinner task={group} />
      { isReduced || (
        <Box flexDirection="column" flexShrink={0} marginLeft={2}>
          { tasks.map((task) =>
            (task instanceof GroupTask) ? (
              <GroupTaskSpinner key={task.id} group={task} />
            ) : (
              <TaskSpinner key={task.id} task={task} />
            )
          ) }
        </Box>
      ) }
    </>
  );
}
