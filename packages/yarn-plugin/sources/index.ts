import type { Plugin } from '@yarnpkg/core';

import { BuildCommand } from './commands/build';
import { EachCommand } from './commands/each';
import { InfoCommand } from './commands/info';
import { ListCommand } from './commands/list';
import { RunCommand } from './commands/run';

// Plugin
const plugin: Plugin = {
  commands: [
    InfoCommand,
    BuildCommand,
    EachCommand,
    ListCommand,
    RunCommand
  ],
};

export default plugin;
