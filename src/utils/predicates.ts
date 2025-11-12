import type { Workload$ } from '@jujulego/tasks';
import type { ScriptWorkflow$ } from '../jobs/run-script$.js';

export function isScriptWorkflow(workload: Workload$): workload is ScriptWorkflow$ {
  return workload.type === 'script';
}
