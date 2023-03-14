import { type Task, type TaskContext } from '@jujulego/tasks';
import { Text } from 'ink';

import type { CommandContext } from '@/src/tasks/command-task';

// Types
export interface TaskNameProps {
  task: Task;
}

// Utils
function isWorkspaceCtx(ctx: Readonly<TaskContext>): ctx is Readonly<CommandContext> {
  return 'workspace' in ctx;
}

// Components
export default function TaskName({ task }: TaskNameProps) {
  if (isWorkspaceCtx(task.context)) {
    return (
      <Text>
        Running <Text bold>{ task.context.command }</Text> in { task.context.workspace.name }
      </Text>
    );
  } else {
    return <Text>{ task.name }</Text>;
  }
}
