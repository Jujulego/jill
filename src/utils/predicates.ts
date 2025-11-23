import type { Job$, Workload$ } from '@kyrielle/workload';
import type { ScriptWorkflow$ } from '../jobs/run-script$.js';

export function isScriptWorkflow(workload: Workload$): workload is ScriptWorkflow$ {
  return workload.type === 'script';
}

export function isJob(workload: Workload$): workload is Job$ {
  return 'dependencies' in workload && typeof workload.dependencies === 'function';
}
