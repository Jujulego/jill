import { EachCommand } from '@/src/commands/each.jsx';
import { GroupCommand } from '@/src/commands/group.jsx';
import { ListCommand } from '@/src/commands/list.jsx';
import { RunCommand } from '@/src/commands/run.jsx';
import { TreeCommand } from '@/src/commands/tree.jsx';
import { Plugin } from '@/src/modules/plugin.js';

// Plugin
@Plugin({
  name: 'core',
  commands: [
    EachCommand,
    GroupCommand,
    ListCommand,
    RunCommand,
    TreeCommand,
  ]
})
export class CorePlugin {}
