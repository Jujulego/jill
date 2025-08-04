import { EachCommand } from '@/src/commands/each.js';
import { ExecCommand } from '@/src/commands/exec.js';
import { GroupCommand } from '@/src/commands/group.js';
import { ListCommand } from '@/src/commands/list.jsx';
import { RunCommand } from '@/src/commands/run.js';
import { TreeCommand } from '@/src/commands/tree.jsx';
import { Plugin } from '@/src/modules/plugin.js';

// Plugin
@Plugin({
  name: 'core',
  commands: [
    EachCommand,
    ExecCommand,
    GroupCommand,
    ListCommand,
    RunCommand,
    TreeCommand,
  ]
})
export class CorePlugin {}
