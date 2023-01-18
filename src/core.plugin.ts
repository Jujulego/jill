import { EachCommand } from '@/src/commands/each';
import { GroupCommand } from '@/src/commands/group';
import { ListCommand } from '@/src/commands/list';
import { RunCommand } from '@/src/commands/run';
import { TreeCommand } from '@/src/commands/tree';
import { Plugin } from '@/src/modules/plugin';

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
