import type { Job$, Workload$ } from '@jujulego/tasks';
import { buildFlatTree, type FlatTreeWorkload } from '../utils/flat-tree.js';

export function buildPlan(job: Workload$): PlanItem[] {
  const tree = buildFlatTree(job, true);

  const index = new Map(tree.map((item, idx) => [item.workload.id, idx + 1]));
  const plan: PlanItem[] = [];
  let branch = '';

  for (let i = 0; i < tree.length; i++) {
    const item = tree[i];

    // Check if branch continues
    let branchContinue = false;

    for (let j = i + 1; j < tree.length; j++) {
      if (tree[j].level <= item.level) {
        if (tree[j].level === item.level) {
          branchContinue = true;
        }

        break;
      }
    }

    // Compute dependencies
    const dependsOn: number[] = [];

    if (isJob(item.workload)) {
      for (const dep of item.workload.dependencies()) {
        const idx = index.get(dep.id);

        if (idx) {
          dependsOn.push(idx);
        }
      }
    }

    // Update branch
    if (branch.length / 3 > item.level) {
      branch = branch.slice(0, branch.length - 3);
    }

    if (item.level > 0 && branch.length / 3 === item.level) {
      branch = branch.slice(0, branch.length - 3);
    }

    if (branch.length / 3 < item.level) {
      if (branchContinue) {
        plan.push({ ...item, id: i + 1, branch: branch + '├─ ', dependsOn });
        branch += '│  ';
      } else {
        plan.push({ ...item, id: i + 1, branch: branch + '└─ ', dependsOn });
        branch += '   ';
      }
    } else {
      plan.push({ ...item, id: i + 1, branch, dependsOn });
    }
  }

  return plan;
}

function isJob(workload: Workload$): workload is Job$ {
  return 'dependencies' in workload && typeof workload.dependencies === 'function';
}

// Types
interface PlanItem extends FlatTreeWorkload {
  readonly id: number;
  readonly branch: string;
  readonly dependsOn: number[];
}
