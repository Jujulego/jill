import { type Workload$, WorkloadState } from '@jujulego/tasks';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import ms from 'pretty-ms';
import { useEffect, useState } from 'react';
import * as symbols from '../utils/symbols.js';
import WorkloadName from './WorkloadName.jsx';

// Component
export default function WorkloadSpinner({ workload }: WorkloadSpinnerProps) {
  // Track task state
  const [state, setState] = useState(workload.state());

  useEffect(() => {
    const sub = workload.state$.subscribe(setState);
    return sub.unsubscribe;
  }, [workload.state$]);

  // Render
  const dim = workload.type === 'spawn';
  const time = workload.duration().seconds() * 1000;


  switch (state) {
    case WorkloadState.Blocked:
    case WorkloadState.Ready:
    case WorkloadState.Starting:
      return (
        <Box>
          <Text color="grey">{'\u00B7'}</Text>
          <Box paddingLeft={1}>
            <WorkloadName color="grey" wrap="truncate" workload={workload} withWorkspace />
          </Box>
        </Box>
      );

    case WorkloadState.Running:
      return (
        <Box>
          <Text dimColor={dim}>
            <Spinner />
          </Text>
          <Box paddingLeft={1}>
            <WorkloadName dimColor={dim} wrap="truncate" workload={workload} withWorkspace />
          </Box>
        </Box>
      );

    case WorkloadState.Canceling:
      return (
        <Box>
          <Text dimColor={dim} color="grey">
            <Spinner type="line2" />
          </Text>
          <Box paddingLeft={1}>
            <WorkloadName dimColor={dim} color="grey" wrap="truncate" workload={workload} withWorkspace />
          </Box>
        </Box>
      );

    case WorkloadState.Succeeded:
      return (
        <Box>
          <Text color="green">{ symbols.success }</Text>
          <Box paddingLeft={1}>
            <WorkloadName dimColor={dim} wrap="truncate" workload={workload} withWorkspace />
          </Box>
          <Box paddingLeft={1} flexShrink={0}>
            <Text color={dim ? 'grey' : 'dim'}>(took {ms(time)})</Text>
          </Box>
        </Box>
      );

    case WorkloadState.Failed:
      return (
        <Box>
          <Text color="red">{ symbols.error }</Text>
          <Box paddingLeft={1}>
            <WorkloadName dimColor={dim} wrap="truncate" workload={workload} withWorkspace />
          </Box>
          <Box paddingLeft={1} flexShrink={0}>
            <Text color={dim ? 'grey' : 'dim'}>(took {ms(time)})</Text>
          </Box>
        </Box>
      );

    case WorkloadState.Canceled:
      return (
        <Box>
          <Text dimColor>-</Text>
          <Box paddingLeft={1}>
            <WorkloadName dimColor wrap="truncate" workload={workload} withWorkspace />
          </Box>
          <Box paddingLeft={1} flexShrink={0}>
            <Text color={dim ? 'grey' : 'dim'}>(took {ms(time)})</Text>
          </Box>
        </Box>
      );
  }
}

export interface WorkloadSpinnerProps {
  readonly workload: Workload$;
}
