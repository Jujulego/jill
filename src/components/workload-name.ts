import type { Workload$ } from '@kyrielle/workload';
import chalk from 'chalk';
import { isScriptWorkflow } from '../utils/predicates.js';
import { capitalize } from '../utils/string.js';

export function workloadName(workload: Workload$): string {
  if (isScriptWorkflow(workload)) {
    return `Run ${chalk.bold(workload.script)} script in ${workload.workspace.name}`;
  }

  let label = workload.label;

  if (workload.type !== 'spawn') {
    label = capitalize(label);
  }

  return label;
}
