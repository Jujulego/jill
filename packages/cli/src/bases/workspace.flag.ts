import { Flags } from '@oclif/core';

// Workspace flag
export const workspaceFlag = Flags.build({
  char: 'w',
  name: 'workspace',
  description: 'Workspace to use',
});