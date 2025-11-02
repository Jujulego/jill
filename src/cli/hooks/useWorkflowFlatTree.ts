import { type Workflow$, type Workload$, WorkloadState } from '@jujulego/tasks';
import { collect$, map$, off$, pipe$ } from 'kyrielle';
import { createHash } from 'node:crypto';
import { useEffect, useState } from 'react';

// Hook
export function useWorkflowFlatTree(workload: Workload$, verbose?: boolean): FlatTreeWorkload[] {
  const [tree, setTree] = useState<FlatTreeWorkload[]>(() => buildTree(workload, verbose));

  useEffect(() => {
    const oldHash = hashTree(tree);
    let dirty = false;

    function update() {
      if (!dirty) return;

      const updated = buildTree(workload, verbose);
      if (hashTree(updated) !== oldHash) {
        setTree(updated);
      }

      dirty = false;
    }

    const off = pipe$(tree,
      map$(({ workload }) => workload.state$.subscribe(() => {
        dirty = true;
        queueMicrotask(update);
      })),
      collect$(off$())
    );

    return () => {
      dirty = false;
      off.unsubscribe();
    };
  }, [tree, verbose, workload]);
  
  return tree;
}

// Utils
function buildTree(workload: Workload$, verbose = false) {
  const stack: FlatTreeWorkload[] = [{ workload, level: 0 }];
  const tree: FlatTreeWorkload[] = [];

  while (stack.length > 0) {
    const item = stack.pop()!;
    const mustShow = [WorkloadState.Starting, WorkloadState.Running, WorkloadState.Failed].includes(item.workload.state());

    if (!verbose && !isWorkflow(item.workload) && !mustShow) {
      continue;
    }

    let level = item.level;

    if (item.workload.label !== '[hidden]') {
      tree.push(item);
      level++;
    }

    if (isWorkflow(item.workload)) {
      const children = [...item.workload.workloads()].reverse();

      for (const workload of children) {
        stack.push({ workload, level });
      }
    }
  }

  return tree;
}

function isWorkflow(workload: Workload$): workload is Workflow$ {
  return 'workloads' in workload && typeof workload.workloads === 'function';
}

function hashTree(tree: FlatTreeWorkload[]) {
  const hash = createHash('sha256');

  for (const { workload } of tree) {
    hash.update(workload.id);
  }

  return hash.digest('hex');
}

// Types
export interface FlatTreeWorkload {
  readonly workload: Workload$;
  readonly level: number;
}
