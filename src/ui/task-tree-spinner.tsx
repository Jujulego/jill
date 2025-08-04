import { TaskManager } from '@jujulego/tasks';
import { useStdin } from 'ink';

import TaskTreeScrollableSpinner from '@/src/ui/task-tree-scrollable-spinner.jsx';
import TaskTreeFullSpinner from '@/src/ui/task-tree-full-spinner.jsx';

// Types
export interface TaskTreeSpinnerProps {
  readonly manager: TaskManager;
}

// Component
export default function TaskTreeSpinner({ manager }: TaskTreeSpinnerProps) {
  const stdin = useStdin();

  if (stdin.isRawModeSupported) {
    return <TaskTreeScrollableSpinner manager={manager} />;
  } else {
    return <TaskTreeFullSpinner manager={manager} />;
  }
}
