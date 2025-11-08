import type { Workload$ } from '@jujulego/tasks';
import chalk from 'chalk';
import process from 'node:process';
import { buildPlan } from './build-plan.js';

export function printPlan(job: Workload$) {
  const plan = buildPlan(job);

  const idLength = Math.ceil(Math.log10(plan.length));
  const branchLength = plan.reduce((max, item) => Math.max(item.branch.length, max), 0) + 1 + idLength;
  const hasDependencies = plan.some((item) => item.dependsOn.length > 0);

  if (hasDependencies) {
    const labelLength = plan.reduce((max, item) => Math.max(item.workload.label.length, max), 0);
    process.stdout.write(chalk.bold(`${''.padEnd(branchLength, ' ')}  ${'Job'.padEnd(labelLength, ' ')}  Depends on\n`));

    for (const item of plan) {
      const branch = `${item.branch}#${item.id.toString().padStart(idLength, '0')}`.padEnd(branchLength, ' ');
      const label = item.workload.label.padEnd(labelLength, ' ');
      const deps = item.dependsOn.map((id) => '#' + id).join(', ');

      process.stdout.write(`${branch}  ${label}  ${deps}\n`);
    }
  } else {
    process.stdout.write(chalk.bold(`${''.padEnd(branchLength, ' ')}  Job\n`));

    for (const item of plan) {
      const branch = `${item.branch}#${item.id.toString().padStart(idLength, '0')}`.padEnd(branchLength, ' ');

      process.stdout.write(`${branch}  ${item.workload.label}\n`);
    }
  }
}
