import type { Workload$ } from '@jujulego/tasks';
import chalk from 'chalk';
import process from 'node:process';
import { buildPlan } from './build-plan.js';

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
