import { plan, type TaskSet } from '@jujulego/tasks';
import { Box, Text } from 'ink';
import { collect$, map$, pipe$ } from 'kyrielle';
import { isCommandCtx } from '../../tasks/command-task.js';
import { isScriptCtx } from '../../tasks/script-task.js';
import TaskName from '../../ui/task-name.jsx';
import { inked } from '../inked.jsx';

const TaskPlanInk = inked(function* ({ tasks }: TaskPlanInkProps) {
  const planned = Array.from(plan(tasks));

  yield (
    <Box>
      <Box flexDirection="column" marginRight={2}>
        <Text bold>ID</Text>
        { pipe$(
          planned,
          map$((task) => (
            <Text key={task.id}>{ task.id.substring(0, 6) }</Text>
          )),
          collect$()
        ) }
      </Box>
      <Box flexDirection="column" marginRight={2}>
        <Text bold>Name</Text>
        { pipe$(
          planned,
          map$((task) => (
            <TaskName key={task.id} task={task} />
          )),
          collect$()
        ) }
      </Box>
      <Box flexDirection="column" marginRight={2}>
        <Text bold>Workspace</Text>
        { pipe$(
          planned,
          map$((task) => (
            <Text key={task.id}>{ isCommandCtx(task.context) || isScriptCtx(task.context) ? task.context.workspace.name : '' }</Text>
          )),
          collect$()
        ) }
      </Box>
      <Box flexDirection="column" marginRight={2}>
        <Text bold>Group</Text>
        { pipe$(
          planned,
          map$((task) => task.groupId ? (
            <Text key={task.id}>{ task.groupId.substring(0, 6) }</Text>
          ) : (
            <Text key={task.id} color="gray">none</Text>
          )),
          collect$()
        ) }
      </Box>
      <Box flexDirection="column" marginRight={2}>
        <Text bold>Depends on</Text>
        { pipe$(
          planned,
          map$((task) => {
            const ids = task.dependenciesIds.map((id) => id.substring(0, 6));

            return ids.length > 0 ? (
              <Text key={task.id}>{ ids.join(', ') }</Text>
            ) : (
              <Text key={task.id} color="gray">none</Text>
            );
          }),
          collect$()
        ) }
      </Box>
    </Box>
  );
});

export default TaskPlanInk;

// Types
export interface TaskPlanInkProps {
  readonly tasks: TaskSet;
}
