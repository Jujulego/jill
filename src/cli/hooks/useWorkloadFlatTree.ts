import type { Workflow$, Workload$ } from '@jujulego/tasks';
import { useMemo } from 'react';

// Hook
export function useWorkloadFlatTree(workload: Workload$, verbose = false): FlatTreeJob[] {
  return useMemo(() => {
    const stack: FlatTreeJob[] = [{ workload, level: 0 }];
    const tree: FlatTreeJob[] = [];

    while (stack.length > 0) {
      const item = stack.pop()!;
      tree.push(item);

      if (isWorkflow(item.workload)) {
        for (const workload of item.workload.workloads()) {
          stack.push({ workload, level: item.level + 1 });
        }
      }
    }

    return tree;
  }, [workload]);
}

// Utils
function isWorkflow(workload: Workload$): workload is Workflow$ {
  return 'workloads' in workload && typeof workload.workloads === 'function';
}

// Types
export interface FlatTreeJob {
  readonly workload: Workload$;
  readonly level: number;
}
