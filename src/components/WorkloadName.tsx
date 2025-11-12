import type { Workload$ } from '@jujulego/tasks';
import { Text, type TextProps } from 'ink';
import { isScriptWorkflow } from '../utils/predicates.js';
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

  let name = workload.label;

  if (workload.type !== 'spawn') {
    name = capitalize(name);
  }

  return <Text {...rest}>{ name }</Text>;
}

export interface WorkloadNameProps extends Omit<TextProps, 'children'> {
  readonly workload: Workload$;
  readonly withWorkspace?: boolean;
}
