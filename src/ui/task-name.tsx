import { type Task } from '@jujulego/tasks';
import { Text } from 'ink';

import { isScriptCtx } from '@/src/tasks/script-task.ts';

// Types
export interface TaskNameProps {
  task: Task;
}

// Components
export default function TaskName({ task }: TaskNameProps) {
  if (isScriptCtx(task.context)) {
    return (
      <Text>
        Running <Text bold>{ task.context.script }</Text> in { task.context.workspace.name }
      </Text>
    );
  } else {
    return <Text>{ task.name }</Text>;
  }
}
