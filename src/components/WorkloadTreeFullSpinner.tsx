import type { Workload$ } from '@kyrielle/workload';
import { Box } from 'ink';
import { useFlatJobTree } from '../hooks/useFlatJobTree.js';
import { WorkloadSpinner } from './WorkloadSpinner.jsx';
import { WorkloadTreeStats } from './WorkloadTreeStats.jsx';

// Component
export function WorkloadTreeFullSpinner({ workload, verbose }: WorkloadTreeFullSpinnerProps) {
  const tree = useFlatJobTree(workload, verbose);

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
