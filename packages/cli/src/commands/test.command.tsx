import { Text } from 'ink';

import { command } from '../command';
import { useProject, withProject } from '../wrappers/project.wrapper';
import { useWorkspace, withWorkspace } from '../wrappers/workspace.wrapper';

// Command
const { wrapper, useArgs } = withProject(withWorkspace(command({
  name: 'test',
  description: 'Just a test !',
  builder: (yargs) => yargs
    .option('success', {
      type: 'boolean',
      default: true,
    })
})));

// Component
export const TestCommand = wrapper(function TestCommand() {
  const { success } = useArgs();
  const project = useProject();
  const workspace = useWorkspace();

  return (
    <Text color={success ? 'green' : 'red'}>Test { success ? 'successful' : 'failed' } in { workspace.name } of { project.root }</Text>
  );
});
