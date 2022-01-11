import { SuperCommand } from '@jujulego/jill-common';

import { KillCommand } from './commands/kill.command';
import { ListCommand } from './commands/list.command';
import { LogsCommand } from './commands/logs.command';
import { SpawnCommand } from './commands/spawn.command';
import { StopCommand } from './commands/stop.command';

// Command
export class MyrCommand extends SuperCommand {
  // Properties
  readonly name = 'myr';
  readonly description = 'Interact with myr server';

  readonly commands = [
    new KillCommand(),
    new ListCommand(),
    new LogsCommand(),
    new SpawnCommand(),
    new StopCommand(),
  ];
}
