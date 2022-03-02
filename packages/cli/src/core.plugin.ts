import { Plugin } from '@jujulego/jill-common';

import { EachCommand } from './commands/each.command';

// Plugin
export const corePlugin = Plugin.createPlugin('core', [
  EachCommand,
]);
