import { type Job$, type Workflow$, type Workload$, WorkloadState } from '@jujulego/tasks';
import { collect$, map$, pipe$ } from 'kyrielle';

export function buildFlatTree(workload: Workload$, verbose = false) {
  const tree: FlatTreeWorkload[] = [];
  const stack: FlatTreeWorkload[] = pipe$(
    listRoots(workload),
    map$((workload) => ({ workload, level: 0 })),
    collect$(),
  );

  while (stack.length > 0) {
    const item = stack.pop()!;
    const mustShow = [WorkloadState.Starting, WorkloadState.Running, WorkloadState.Failed].includes(item.workload.state());

    if (!verbose && !isWorkflow(item.workload) && !mustShow && item.level > 0) {
      continue;
    }

    // Add to tree
    let level = item.level;

    if (item.workload.label !== '[hidden]') {
      tree.push(item);
      level++;
    }

    // Load "member" tasks
    if (isWorkflow(item.workload)) {
      const children = [...item.workload.workloads()].reverse();

      for (const workload of children) {
        stack.push({ workload, level });
      }
    }
  }

  return tree;
}

function* listRoots(workload: Workload$) {
  const marks = new Set<string>();
  const queue = [workload];

  while (queue.length) {
    const item = queue.shift()!;

    // Mark all member of workflows, so they're not added as root
    if (isWorkflow(item)) {
      for (const wkl of item.workloads()) {
        marks.add(wkl.id);
        queue.unshift(wkl);
      }
    }

    // Load job dependencies
    if (isJob(item)) {
      for (const dep of item.dependencies()) {
        queue.push(dep);
      }
    }

    // Ignore marked workloads
    if (marks.has(item.id)) {
      continue;
    }

    yield item;
    marks.add(item.id);
  }
}

function isJob(workload: Workload$): workload is Job$ {
  return 'dependencies' in workload && typeof workload.dependencies === 'function';
}

function isWorkflow(workload: Workload$): workload is Workflow$ {
  return 'workloads' in workload && typeof workload.workloads === 'function';
}

// Types
export interface FlatTreeWorkload {
  readonly level: number;
  readonly workload: Workload$;
}
