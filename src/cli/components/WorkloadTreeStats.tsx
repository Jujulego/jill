import { WorkloadState } from '@jujulego/tasks';
import { Text, type TextProps } from 'ink';
import Spinner from 'ink-spinner';
import { useMemo } from 'react';
import * as symbols from '../../utils/symbols.js';
import { useScriptsStats } from '../hooks/useScriptsStats.js';
import type { FlatTreeWorkload } from '../utils/flat-tree.js';

// Component
export default function WorkloadTreeStats({ tree, ...rest }: WorkloadTreeStatsProps) {
  const workloads = useMemo(() => tree.map((item) => item.workload), [tree]);
  const stats = useScriptsStats(workloads);

  // Render
  const running = stats[WorkloadState.Running] + stats[WorkloadState.Starting] + stats[WorkloadState.Canceling];
  const done = stats[WorkloadState.Succeeded];
  const failed = stats[WorkloadState.Failed];
  const canceled = stats[WorkloadState.Canceled];

  return (
    <Text {...rest}>
      { (running > 0) && (
        <><Spinner type="sand" /> <Text bold>{ running }</Text> running</>
      ) }
      { (running > 0 && done > 0) && ', ' }
      { (done > 0) && (
        <Text color="green">{ symbols.success } { done } done</Text>
      ) }
      { (running + done > 0 && failed > 0) && ', ' }
      { (failed > 0) && (
        <Text color="red">{ symbols.error } { failed } failed</Text>
      ) }
      { (running + done + failed > 0 && canceled > 0) && ', ' }
      { (canceled > 0) && (
        <Text dimColor>- { canceled } canceled</Text>
      ) }
    </Text>
  );
}

export interface WorkloadTreeStatsProps extends Omit<TextProps, 'children'> {
  readonly tree: readonly FlatTreeWorkload[];
}
