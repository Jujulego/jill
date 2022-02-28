import { Text } from 'ink';

import { command } from '../command';
import { useProject, withProject } from '../project.wrapper';

// Command
const { wrapper, useArgs } = withProject(command({
  name: 'test',
  description: 'Just a test !',
  builder: (yargs) => yargs
    .option('success', {
      type: 'boolean',
      default: true,
    })
}));

// Component
export const TestCommand = wrapper(function TestCommand() {
  const { success } = useArgs();
  const project = useProject();

  return (
    <Text color={success ? 'green' : 'red'}>Test { success ? 'successful' : 'failed' } in { project.root }</Text>
  );
});
