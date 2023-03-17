import { type Task, type TaskContext } from '@jujulego/tasks';
import { Text } from 'ink';

import type { CommandContext } from '@/src/tasks/command-task';
import type { ScriptContext } from '@/src/tasks/script-task';

// Types
export interface TaskNameProps {
  task: Task;
}

// Utils
function isCommandCtx(ctx: Readonly<TaskContext>): ctx is Readonly<CommandContext> {
  return 'workspace' in ctx && 'command' in ctx;
}

function isScriptCtx(ctx: Readonly<TaskContext>): ctx is Readonly<ScriptContext> {
  return 'workspace' in ctx && 'script' in ctx;
}

// Components
export default function TaskName({ task }: TaskNameProps) {
  if (isCommandCtx(task.context)) {
    return (
      <Text>
        Running <Text bold>{ task.context.command }</Text> in { task.context.workspace.name }
      </Text>
    );
  } else if (isScriptCtx(task.context)) {
    return (
      <Text>
        Running <Text bold>{ task.context.script }</Text> in { task.context.workspace.name }
      </Text>
    );
  } else {
    return <Text>{ task.name }</Text>;
  }
}
