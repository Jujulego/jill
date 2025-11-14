import type { Workload$ } from '@jujulego/tasks';
import { useStdin } from 'ink';
import { WorkloadTreeFullSpinner } from './WorkloadTreeFullSpinner.jsx';
import { WorkloadTreeScrollableSpinner } from './WorkloadTreeScrollableSpinner.jsx';

// Component
export function WorkloadTreeSpinner({ workload, verbose }: WorkloadTreeSpinnerProps) {
  const stdin = useStdin();

  if (stdin.isRawModeSupported) {
    return <WorkloadTreeScrollableSpinner workload={workload} verbose={verbose} />;
  } else {
    return <WorkloadTreeFullSpinner workload={workload} verbose={verbose} />;
  }
}

export interface WorkloadTreeSpinnerProps {
  readonly workload: Workload$;
  readonly verbose?: boolean;
}
