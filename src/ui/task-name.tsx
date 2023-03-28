import { type Task } from '@jujulego/tasks';
import { Text } from 'ink';

import { isScriptCtx } from '@/src/tasks/script-task';

// Types
export interface TaskNameProps {
  task: Task;
}

// Components
export default function TaskName({ task }: TaskNameProps) {
  if (isScriptCtx(task.context)) {
    return (
      <>
        Running <Text bold>{ task.context.script }</Text> in { task.context.workspace.name }
      </>
    );
  } else {
    return <>{ task.name }</>;
  }
}
