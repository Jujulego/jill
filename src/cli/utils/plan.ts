import type { Workload$ } from '@jujulego/tasks';
import chalk from 'chalk';
import process from 'node:process';
import { buildTree, type FlatTreeWorkload } from './flat-tree.js';

export function printPlan(job: Workload$) {
  const plan = buildPlan(job);

  const idLength = Math.ceil(Math.log10(plan.length));
  const treeDepth = plan.reduce((max, item) => Math.max(item.branch.length, max), 0) + 1 + idLength;

  process.stdout.write(`${''.padEnd(treeDepth, ' ')} ${chalk.bold('Job')}\n`);

  for (const item of plan) {
    const branch = `${item.branch}#${item.id.toString().padStart(idLength, '0')}`;

    process.stdout.write(`${branch.padEnd(treeDepth, ' ')} ${item.workload.label}\n`);
  }
}

function buildPlan(job: Workload$): PlanItem[] {
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
