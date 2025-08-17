import type { TaskSet } from '@jujulego/tasks';
import { inject$ } from '@kyrielle/injector';
import { waitFor$ } from 'kyrielle';
import process from 'node:process';
import { TASK_MANAGER } from '../../tokens.js';
import TaskTreeCompleted from '../components/TaskTreeCompleted.jsx';
import TaskTreeSpinner from '../components/TaskTreeSpinner.jsx';
import { inked } from '../inked.jsx';

const TaskExecInk = inked(async function* ({ tasks, verbose }: TaskExecInkProps) {
  const manager = await inject$(TASK_MANAGER);

  yield <TaskTreeSpinner manager={manager} verbose={verbose} />;
  tasks.start(manager);

  const results = await waitFor$(tasks.events$, 'finished');
  yield <TaskTreeCompleted manager={manager} verbose={verbose} />;

  if (results.failed > 0) {
    process.exitCode = 1;
  }
});

export default TaskExecInk;

// Types
export interface TaskExecInkProps {
  readonly tasks: TaskSet;
  readonly verbose?: boolean;
}
