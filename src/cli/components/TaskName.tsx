import { type Task, type TaskSummary } from '@jujulego/tasks';
import { Text } from 'ink';
import { isScriptCtx } from '../../tasks/script-task.js';

// Components
export default function TaskName({ task, withWorkspace }: TaskNameProps) {
  if (isScriptCtx(task.context)) {
    return (
      <Text>
        Run <Text bold>{ task.context.script }</Text> script{ withWorkspace && <>{' '}in { task.context.workspace.name }</> }
      </Text>
    );
  } else {
    return <Text>{ task.name }</Text>;
  }
}

// Types
export interface TaskNameProps {
  readonly task: Task | TaskSummary;
  readonly withWorkspace?: boolean;
}
