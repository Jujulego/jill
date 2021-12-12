import { WorkspaceDepsMode } from '@jujulego/jill-core';
import { Flags } from '@oclif/core';

// Workspace flag
export const depsModeFlag = () => Flags.enum<WorkspaceDepsMode>({
  name: 'deps-mode',
  default: 'all',
  options: ['all', 'prod', 'none'],
  description: 'Dependency selection mode:\n' +
    ' - all = dependencies AND devDependencies\n' +
    ' - prod = dependencies\n' +
    ' - none = nothing'
});