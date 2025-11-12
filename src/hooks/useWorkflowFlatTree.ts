import { type Workload$ } from '@jujulego/tasks';
import { collect$, map$, off$, pipe$ } from 'kyrielle';
import { createHash } from 'node:crypto';
import { useEffect, useState } from 'react';
import { buildFlatTree, type FlatTreeWorkload } from '../cli/utils/flat-tree.js';

// Hook
export function useWorkflowFlatTree(workload: Workload$, verbose?: boolean): FlatTreeWorkload[] {
  const [tree, setTree] = useState<FlatTreeWorkload[]>(() => buildFlatTree(workload, verbose));

  useEffect(() => {
    const oldHash = hashTree(tree);
    let dirty = false;

    function update() {
      if (!dirty) return;

      const updated = buildFlatTree(workload, verbose);
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
function hashTree(tree: FlatTreeWorkload[]) {
  const hash = createHash('sha256');

  for (const { workload } of tree) {
    hash.update(workload.id);
  }

  return hash.digest('hex');
}
