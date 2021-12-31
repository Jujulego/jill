import { Builder, Command } from '@jujulego/jill-common';

import { KillCommand } from './commands/kill.command';
import { ListCommand } from './commands/list.command';
import { LogsCommand } from './commands/logs.command';
import { SpawnCommand } from './commands/spawn.command';
import { StopCommand } from './commands/stop.command';

// Command
export class MyrCommand extends Command {
  // Properties
  readonly name = 'myr';
  readonly description = 'Interact with myr server';

  readonly commands: readonly Command[] = [
    new KillCommand(),
    new ListCommand(),
    new LogsCommand(),
    new SpawnCommand(),
    new StopCommand(),
  ];

  // Methods
  protected define<T, U>(builder: Builder<T, U>): Builder<T, U> {
    return yargs => this.commands.reduce((y, cmd) => cmd.setup(y), builder(yargs));
  }

  protected run(): number {
    return 0;
  }
}
