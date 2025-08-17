import { type TaskManager } from '@jujulego/tasks';
import { useStdin } from 'ink';
import TaskTreeFullSpinner from '../cli/components/TaskTreeFullSpinner.jsx';
import TaskTreeScrollableSpinner from '../cli/components/TaskTreeScrollableSpinner.jsx';

// Component
export default function TaskTreeSpinner({ manager, verbose }: TaskTreeSpinnerProps) {
  const stdin = useStdin();

  if (stdin.isRawModeSupported) {
    return <TaskTreeScrollableSpinner manager={manager} verbose={verbose} />;
  } else {
    return <TaskTreeFullSpinner manager={manager} verbose={verbose} />;
  }
}

// Types
export interface TaskTreeSpinnerProps {
  readonly manager: TaskManager;
  readonly verbose?: boolean;
}
