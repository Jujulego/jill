import type { Workload$ } from '@jujulego/tasks';
import { Box, Static } from 'ink';
import { useWorkloadFlatTree } from '../hooks/useWorkloadFlatTree.js';
import WorkloadSpinner from './WorkloadSpinner.jsx';

// Component
export default function WorkloadTreeCompleted({ workload, verbose }: WorkloadTreeCompletedProps) {
  const tree = useWorkloadFlatTree(workload, verbose);

  // Render
  return (
    <>
      <Static items={tree}>
        { ({ workload, level }) => (
          <Box key={workload.id} marginLeft={level * 2} flexShrink={0}>
            <WorkloadSpinner workload={workload} />
          </Box>
        ) }
      </Static>
    </>
  );
}

export interface WorkloadTreeCompletedProps {
  readonly workload: Workload$;
  readonly verbose?: boolean;
}
