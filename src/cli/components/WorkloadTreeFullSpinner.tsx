import type { Workload$ } from '@jujulego/tasks';
import { Box } from 'ink';
import { useWorkloadFlatTree } from '../hooks/useWorkloadFlatTree.js';
import WorkloadSpinner from './WorkloadSpinner.jsx';

// Component
export default function WorkloadTreeFullSpinner({ workload, verbose }: WorkloadTreeFullSpinnerProps) {
  const tree = useWorkloadFlatTree(workload, verbose);

  // Render
  return (
    <>
      <Box flexDirection="column">
        { tree.map(({ workload, level }) => (
          <Box key={workload.id} marginLeft={level * 2} flexShrink={0}>
            <WorkloadSpinner workload={workload} />
          </Box>
        )) }
      </Box>
    </>
  );
}

export interface WorkloadTreeFullSpinnerProps {
  readonly workload: Workload$;
  readonly verbose?: boolean;
}
