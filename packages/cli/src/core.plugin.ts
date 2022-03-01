import { Plugin } from '@jujulego/jill-common';

import { EachCommand } from './commands/each.command';
import { RunCommand } from './commands/run.command';

// Plugin
export const corePlugin = Plugin.createPlugin('core', [
  RunCommand,
  EachCommand,
]);
