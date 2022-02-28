import { Box, Text } from 'ink';

import { command } from '../command';
import { withProject } from '../wrappers/project.wrapper';
import { useWorkspace, withWorkspace } from '../wrappers/workspace.wrapper';
import path from 'path';

// Command
const { wrapper } = withProject(withWorkspace(command({
  name: 'info',
  description: 'Print workspace data',
  builder: (yargs) => yargs
})));

// Component
export const InfoCommand = wrapper(function InfoCommand() {
  const wks = useWorkspace();
  const mnf = wks.manifest;

  // Render
  return (
    <>
      <Text>Workspace <Text bold>{ wks.name }</Text>:</Text>
      <Box>
        <Box flexDirection="column" marginRight={1}>
          <Text bold>Version:</Text>
          <Text bold>Directory:</Text>
        </Box>
        <Box flexDirection="column">
          <Text color={mnf.version ? '' : 'grey'}>{ mnf.version || 'unset' }</Text>
          <Text>{ path.relative(process.cwd(), wks.cwd) || '.' }</Text>
        </Box>
      </Box>
    </>
  );
});
