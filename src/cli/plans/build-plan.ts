import type { Workload$ } from '@jujulego/tasks';
import { buildTree, type FlatTreeWorkload } from '../utils/flat-tree.js';

export function buildPlan(job: Workload$): PlanItem[] {
  const tree = buildTree(job, true);
  const plan: PlanItem[] = [];

  let branch = '';

  for (let i = 0; i < tree.length; i++) {
    let branchContinue = false;
    const item = tree[i];

    for (let j = i + 1; j < tree.length; j++) {
      if (tree[j].level <= item.level) {
        if (tree[j].level === item.level) {
          branchContinue = true;
        }

        break;
      }
    }

    if (branch.length / 3 > item.level) {
      branch = branch.slice(0, branch.length - 3);
    }

    if (item.level > 0 && branch.length / 3 === item.level) {
      branch = branch.slice(0, branch.length - 3);

      if (branchContinue) {
        plan.push({ ...item, id: i + 1, branch: branch + '├─ ' });
        branch += '│  ';
      } else {
        plan.push({ ...item, id: i + 1, branch: branch + '└─ ' });
        branch += '   ';
      }
    } else if (branch.length / 3 < item.level) {
      if (branchContinue) {
        plan.push({ ...item, id: i + 1, branch: branch + '├─ ' });
        branch += '│  ';
      } else {
        plan.push({ ...item, id: i + 1, branch: branch + '└─ ' });
        branch += '   ';
      }
    } else {
      plan.push({ ...item, id: i + 1, branch });
    }
  }

  return plan;
}

// Types
interface PlanItem extends FlatTreeWorkload {
  readonly id: number;
  readonly branch: string;
}
