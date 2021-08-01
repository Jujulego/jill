import type { Plugin } from '@yarnpkg/core';

import { InfoCommand } from './commands/info';
import { BuildCommand } from './commands/build';
import { EachCommand } from './commands/each';

// Plugin
const plugin: Plugin = {
  commands: [
    InfoCommand,
    BuildCommand,
    EachCommand
  ],
};

export default plugin;
