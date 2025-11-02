import { type Workload$, WorkloadState } from '@jujulego/tasks';
import { collect$, map$, off$, pipe$ } from 'kyrielle';
import { useEffect, useState } from 'react';

// Hook
export function useScriptsStats(workloads: readonly Workload$[]) {
  const [stats, setStats] = useState(() => countScripts(workloads));

  useEffect(() => {
    let dirty = false;

    function recount() {
      if (!dirty) return;

      setStats(countScripts(workloads));
      dirty = false;
    }

    const off = pipe$(workloads,
      map$((wkl) => wkl.state$.subscribe(() => {
        dirty = true;
        queueMicrotask(recount);
      })),
      collect$(off$())
    );

    return () => {
      dirty = false;
      off.unsubscribe();
    };
  }, [workloads]);
  
  return stats;
}

// Utils
function countScripts(workloads: readonly Workload$[]): Readonly<WorkloadsStats> {
  const stats: WorkloadsStats = {
    [WorkloadState.Ready]: 0,
    [WorkloadState.Blocked]: 0,
    [WorkloadState.Starting]: 0,
    [WorkloadState.Running]: 0,
    [WorkloadState.Succeeded]: 0,
    [WorkloadState.Failed]: 0,
    [WorkloadState.Canceling]: 0,
    [WorkloadState.Canceled]: 0,
  };

  for (const workload of workloads) {
    if (workload.type === 'script') {
      stats[workload.state()] += 1;
    }
  }

  return stats;
}

// Types
export type WorkloadsStats = Record<WorkloadState, number>;