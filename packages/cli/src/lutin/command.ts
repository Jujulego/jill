import yargs from 'yargs';

import { listCommand } from './commands/list';
import { commandHandler } from '../wrapper';

// Command
export function lutinCommand(yargs: yargs.Argv) {
  yargs
    .command(['list', 'ls'], 'List lutin tasks', {}, commandHandler(listCommand))
    .demandCommand(1);
}