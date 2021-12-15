import yargs from 'yargs';

import { KillCommand } from './commands/kill.command';
import { ListCommand } from './commands/list.command';
import { LogsCommand } from './commands/logs.command';
import { SpawnCommand } from './commands/spawn.command';
import { StopCommand } from './commands/stop.command';

// Command
export function myrCommand(yargs: yargs.Argv) {
  yargs.strictCommands();

  // Commands
  (new KillCommand(yargs)).run();
  (new ListCommand(yargs)).run();
  (new LogsCommand(yargs)).run();
  (new SpawnCommand(yargs)).run();
  (new StopCommand(yargs)).run();
}