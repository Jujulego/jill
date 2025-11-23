import type { Workload$ } from '@kyrielle/workload';
import { Box, Text, useInput } from 'ink';
import { useState } from 'react';
import { useFlatJobTree } from '../hooks/useFlatJobTree.js';
import { useStdoutDimensions } from '../hooks/useStdoutDimensions.js';
import { WorkloadSpinner } from './WorkloadSpinner.jsx';
import { WorkloadTreeStats } from './WorkloadTreeStats.jsx';

// Component
export function WorkloadTreeScrollableSpinner({ workload, verbose }: WorkloadTreeScrollableSpinnerProps) {
  const tree = useFlatJobTree(workload, verbose);

  // Manage scroll
  const { rows: termRows } = useStdoutDimensions();
  const [scroll, setScroll] = useState(0);

  const maxRows = Math.min(termRows - 4, tree.length);
  const firstIndex = Math.max(0, tree.length - scroll - maxRows);
  const lastIndex = Math.min(tree.length, firstIndex + maxRows);
  const effectiveScroll = tree.length - lastIndex;

  useInput((_, key) => {
    if (key.upArrow) {
      setScroll(Math.min(tree.length - maxRows, effectiveScroll + 1));
    } else {
      setScroll(Math.max(0, effectiveScroll - 1));
    }
  });

  // Render
  const slice = tree.slice(firstIndex, lastIndex);

  return (
    <>
      <Box flexDirection="column">
        { slice.map(({ workload, level }) => (
          <Box key={workload.id} marginLeft={level * 2} flexShrink={0}>
            <WorkloadSpinner workload={workload} />
          </Box>
        )) }
      </Box>
      <Text>
        <WorkloadTreeStats tree={tree} />
        { (termRows < tree.length) && (<Text color="grey"> | use keyboard arrows to scroll</Text>) }
      </Text>
    </>
  );
}

export interface WorkloadTreeScrollableSpinnerProps {
  readonly workload: Workload$;
  readonly verbose?: boolean;
}
