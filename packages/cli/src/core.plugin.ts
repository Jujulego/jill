import { Plugin } from '@jujulego/jill-common';

import { EachCommand } from './commands/each.command';
import { InfoCommand } from './commands/info.command';
import { ListCommand } from './commands/list.command';
import { RunCommand } from './commands/run.command';

// Plugin
export const corePlugin = Plugin.createPlugin('core', [
  InfoCommand,
  ListCommand,
  RunCommand,
  EachCommand,
]);
