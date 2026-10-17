import type { Workload$ } from '@kyrielle/workload';
import { Box, type DOMElement, Text, useBoxMetrics, useInput, useWindowSize } from 'ink';
import { useRef, useState } from 'react';
import { useFlatJobTree } from '../hooks/useFlatJobTree.js';
import { WorkloadSpinner } from './WorkloadSpinner.jsx';
import { WorkloadTreeStats } from './WorkloadTreeStats.jsx';

// Component
export function WorkloadTreeScrollableSpinner({ workload, verbose }: WorkloadTreeScrollableSpinnerProps) {
  const tree = useFlatJobTree(workload, verbose);

  // Manage scroll
  const contentRef = useRef<DOMElement>(null);

  const { rows } = useWindowSize();
  const { height } = useBoxMetrics(contentRef);

  const [scroll, setScroll] = useState(0);

  const maxHeight = rows - 4;
  const maxScroll = Math.max(0, height - maxHeight);
  const effectiveScroll = Math.min(height - maxHeight, scroll);

  useInput((_, key) => {
    if (key.upArrow) {
      setScroll(Math.max(0, effectiveScroll - 1));
    } else if (key.downArrow) {
      setScroll(Math.min(maxScroll, effectiveScroll + 1));
    }
  });

  // Render
  return (
    <>
      <Box flexDirection="column" overflow="hidden" maxHeight={rows - 4} contentOffsetY={effectiveScroll}>
        <Box ref={contentRef} flexDirection="column" flexShrink={0}>
          { tree.map(({ workload, level }) => (
            <Box key={workload.id} marginLeft={level * 2} flexShrink={0}>
              <WorkloadSpinner workload={workload} />
            </Box>
          )) }
        </Box>
      </Box>
      <Text>
        <WorkloadTreeStats tree={tree} />
        { (height > maxHeight) && (<Text color="grey"> | use keyboard arrows to scroll</Text>) }
      </Text>
    </>
  );
}

export interface WorkloadTreeScrollableSpinnerProps {
  readonly workload: Workload$;
  readonly verbose?: boolean;
}
