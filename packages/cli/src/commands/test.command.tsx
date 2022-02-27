import { Text } from 'ink';

import { command } from '../command';

// Command
const { wrapper, useArgs } = command({
  name: 'test',
  description: 'Just a test !',
  builder: (yargs) => yargs
    .option('success', {
      type: 'boolean',
      default: true,
    })
});

// Component
export const TestCommand = wrapper(function TestCommand() {
  const { success } = useArgs();

  return (
    <Text color={success ? 'green' : 'red'}>Test { success ? 'successful' : 'failed' }</Text>
  );
});
