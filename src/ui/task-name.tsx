import { Task, TaskContext } from '@jujulego/tasks';
import { Text } from 'ink';
import { FC } from 'react';

import { WorkspaceContext } from '../project';

// Types
export interface TaskNameProps {
  task: Task;
}

// Utils
function isWorkspaceCtx(ctx: Readonly<TaskContext>): ctx is Readonly<WorkspaceContext> {
  return 'workspace' in ctx;
}

// Components
export const TaskName: FC<TaskNameProps> = ({ task }) => {
  if (isWorkspaceCtx(task.context)) {
    return (
      <Text>
        Running <Text bold>{ task.context.script }</Text> in { task.context.workspace.name }
      </Text>
    );
  } else {
    return <Text>{ task.name }</Text>;
  }
};
