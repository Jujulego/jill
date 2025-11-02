import type { Workflow$, Workload$ } from '@jujulego/tasks';
import { useMemo } from 'react';

// Hook
export function useWorkflowFlatTree(workload: Workload$, verbose = false): FlatTreeWorkload[] {
  return useMemo(() => {
    const stack: FlatTreeWorkload[] = [{ workload, level: 0 }];
    const tree: FlatTreeWorkload[] = [];

    while (stack.length > 0) {
      const item = stack.pop()!;
      let level = item.level;

      if (item.workload.label !== '--hidden--') {
        tree.push(item);
        level++;
      }

      if (isWorkflow(item.workload)) {
        for (const workload of item.workload.workloads()) {
          stack.push({ workload, level });
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
export interface FlatTreeWorkload {
  readonly workload: Workload$;
  readonly level: number;
}
