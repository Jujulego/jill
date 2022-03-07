import { Plugin } from '@jujulego/jill-common';

import { MyrCommand } from './myr.command';
import { WatchCommand } from './watch.command';

// Plugin
const myrPlugin = Plugin.createPlugin('myr', [
  MyrCommand,
  WatchCommand
]);

export default myrPlugin;
export { WatchTaskFragment } from './common/watch-task.model';
