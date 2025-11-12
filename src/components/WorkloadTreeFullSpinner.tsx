import type { Workload$ } from '@jujulego/tasks';
import { Box } from 'ink';
import { useWorkflowFlatTree } from '../cli/hooks/useWorkflowFlatTree.js';
import WorkloadSpinner from './WorkloadSpinner.jsx';
import WorkloadTreeStats from './WorkloadTreeStats.jsx';

// Component
export default function WorkloadTreeFullSpinner({ workload, verbose }: WorkloadTreeFullSpinnerProps) {
  const tree = useWorkflowFlatTree(workload, verbose);

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
      <WorkloadTreeStats tree={tree} />
    </>
  );
}

export interface WorkloadTreeFullSpinnerProps {
  readonly workload: Workload$;
  readonly verbose?: boolean;
}
