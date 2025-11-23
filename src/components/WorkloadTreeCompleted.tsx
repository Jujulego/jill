import type { Workload$ } from '@kyrielle/workload';
import { Box, Static } from 'ink';
import { useFlatJobTree } from '../hooks/useFlatJobTree.js';
import { WorkloadSpinner } from './WorkloadSpinner.jsx';
import { WorkloadTreeStats } from './WorkloadTreeStats.jsx';

// Component
export function WorkloadTreeCompleted({ workload, verbose }: WorkloadTreeCompletedProps) {
  const tree = useFlatJobTree(workload, verbose);

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
      <WorkloadTreeStats tree={tree} />
    </>
  );
}

export interface WorkloadTreeCompletedProps {
  readonly workload: Workload$;
  readonly verbose?: boolean;
}
