import type { Plugin } from '@yarnpkg/core';

import { InfoCommand } from './commands/info';
import { BuildCommand } from './commands/build';

// Plugin
const plugin: Plugin = {
  commands: [
    InfoCommand,
    BuildCommand,
  ],
};

export default plugin;
