import { TaskManager } from '@jujulego/tasks';
import { Text } from 'ink';
import Spinner from 'ink-spinner';
import symbols from 'log-symbols';
import { useLayoutEffect, useState } from 'react';

// Types
export interface TaskTreeStatsProps {
  readonly manager: TaskManager;
}

// Component
export default function TaskTreeStats({ manager }: TaskTreeStatsProps) {
  // Follow stats
  const [stats, setStats] = useState(() => {
    const base = { running: 0, done: 0, failed: 0 };
    
    for (const task of manager.tasks) {
      switch (task.status) {
        case 'starting':
        case 'running':
          base.running += task.weight;
          break;

        case 'done':
          base.done += task.weight;
          break;

        case 'failed':
          base.failed += task.weight;
          break;
      }
    }
    
    return base;
  });

  useLayoutEffect(() => manager.on('started', (task) => {
    setStats((old) => ({
      ...old,
      running: old.running + task.weight
    }));
  }), [manager]);

  useLayoutEffect(() => manager.on('completed', (task) => {
    setStats((old) => ({
      running: old.running - task.weight,
      done: task.status === 'done' ? old.done + task.weight : old.done,
      failed: task.status === 'failed' ? old.failed + task.weight : old.failed,
    }));
  }), [manager]);

  // Render
  return (
    <Text>
      { (stats.running !== 0) && (
        <><Spinner type="sand" /> <Text bold>{ stats.running }</Text> running</>
      ) }
      { (stats.running !== 0 && stats.done !== 0) && (<>, </>) }
      { (stats.done !== 0) && (
        <><Text color="green">{ symbols.success } { stats.done } done</Text></>
      ) }
      { (stats.running + stats.done !== 0 && stats.failed !== 0) && (<>, </>) }
      { (stats.failed !== 0) && (
        <><Text color="red">{ symbols.error } { stats.failed } failed</Text></>
      ) }
    </Text>
  );
}
