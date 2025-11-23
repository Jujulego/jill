import { type Workload$ } from '@kyrielle/workload';
import { collect$, map$, off$, pipe$ } from 'kyrielle';
import { createHash } from 'node:crypto';
import { useEffect, useState } from 'react';
import { flatJobTree, type FlatJobTreeItem } from '../trees/flat-job-tree.js';

// Hook
export function useFlatJobTree(workload: Workload$, verbose?: boolean): FlatJobTreeItem[] {
  const [tree, setTree] = useState<FlatJobTreeItem[]>(() => flatJobTree(workload, verbose));

  useEffect(() => {
    const oldHash = hashTree(tree);
    let dirty = false;

    function update() {
      if (!dirty) return;

      const updated = flatJobTree(workload, verbose);
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
function hashTree(tree: FlatJobTreeItem[]) {
  const hash = createHash('sha256');

  for (const { workload } of tree) {
    hash.update(workload.id);
  }

  return hash.digest('hex');
}
