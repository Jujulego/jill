import type { Workload$ } from '@jujulego/tasks';
import { Text, type TextProps } from 'ink';
import type { ScriptWorkflow$ } from '../jobs/run-script$.js';
import { capitalize } from '../utils/string.js';

// Component
export default function WorkloadName({ workload, withWorkspace, ...rest }: WorkloadNameProps) {
  if (isScriptWorkflow(workload)) {
    return (
      <Text {...rest}>
        Run <Text bold>{ workload.script }</Text> script{ withWorkspace && <>{' '}in {workload.workspace.name}</>}
      </Text>
    );
  }

  return <Text {...rest}>{ capitalize(workload.label) }</Text>;
}

export interface WorkloadNameProps extends Omit<TextProps, 'children'> {
  readonly workload: Workload$;
  readonly withWorkspace?: boolean;
}

// Utils
export function isScriptWorkflow(workload: Workload$): workload is ScriptWorkflow$ {
  return workload.type === 'script';
}
