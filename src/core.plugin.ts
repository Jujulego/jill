import { EachCommand } from '@/src/commands/each.ts';
import { ExecCommand } from '@/src/commands/exec.tsx';
import { GroupCommand } from '@/src/commands/group.ts';
import { ListCommand } from '@/src/commands/list.tsx';
import { RunCommand } from '@/src/commands/run.ts';
import { TreeCommand } from '@/src/commands/tree.tsx';
import { Plugin } from '@/src/modules/plugin.ts';

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
