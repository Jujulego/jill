import type { Workload$ } from '@kyrielle/workload';
import chalk from 'chalk';
import { flatJobPlan } from '../trees/flat-job-plan.js';
import { workloadName } from './workload-name.js';

export function jobPlan(job: Workload$, stream: NodeJS.WriteStream = process.stdout) {
  const plan = flatJobPlan(job);

  const idLength = Math.ceil(Math.log10(plan.length));
  const branchLength = plan.reduce((max, item) => Math.max(item.branch.length, max), 0) + 1 + idLength;
  const hasDependencies = plan.some((item) => item.dependsOn.length > 0);

  if (hasDependencies) {
    const labelLength = plan.reduce((max, item) => Math.max(workloadName(item.workload).length, max), 0);
    stream.write(chalk.bold(`${''.padEnd(branchLength, ' ')}  ${'Job'.padEnd(labelLength, ' ')}  Depends on\n`));

    for (const item of plan) {
      const branch = `${item.branch}#${item.id.toString().padStart(idLength, '0')}`.padEnd(branchLength, ' ');
      const label = workloadName(item.workload).padEnd(labelLength, ' ');
      const deps = item.dependsOn.map((id) => '#' + id).join(', ');

      stream.write(`${branch}  ${label}  ${deps}\n`);
    }
  } else {
    stream.write(chalk.bold(`${''.padEnd(branchLength, ' ')}  Job\n`));

    for (const item of plan) {
      const branch = `${item.branch}#${item.id.toString().padStart(idLength, '0')}`.padEnd(branchLength, ' ');

      stream.write(`${branch}  ${workloadName(item.workload)}\n`);
    }
  }
}

