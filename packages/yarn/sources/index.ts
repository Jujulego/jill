import type { Plugin } from '@yarnpkg/core';

import { InfoCommand } from './commands/info';

// Plugin
const plugin: Plugin = {
  commands: [
    InfoCommand,
  ],
};

export default plugin;
