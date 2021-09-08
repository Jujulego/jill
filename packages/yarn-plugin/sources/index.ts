import type { Plugin } from '@yarnpkg/core';

import { EachCommand } from './commands/each';
import { InfoCommand } from './commands/info';
import { ListCommand } from './commands/list';
import { RunCommand } from './commands/run';

// Plugin
const plugin: Plugin = {
  commands: [
    InfoCommand,
    EachCommand,
    ListCommand,
    RunCommand
  ],
};

export default plugin;
