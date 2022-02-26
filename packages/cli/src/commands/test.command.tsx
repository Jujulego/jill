import { Text } from 'ink';

import { command } from '../command.hoc';

// Command
export const TestCommand = command({
  name: 'test',
  description: 'Just a test !',
  define: (yargs) => yargs
    .option('success', {
      type: 'boolean',
      default: true,
    })
}, function TestCommand({ success }) {
  return (
    <Text color={success ? 'green' : 'red'}>Test { success ? 'successful' : 'failed' }</Text>
  );
});
