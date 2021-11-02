import yargs from 'yargs';

import { listCommand } from './commands/list';
import { commandHandler } from '../wrapper';

// Command
export function lutinCommand(yargs: yargs.Argv) {
  yargs
    .command(['list', 'ls'], 'List lutin tasks', {
      all: {
        alias: 'a',
        type: 'boolean',
        group: 'Filters:',
        desc: 'Show all tasks (by default list shows only running tasks)',
      },
      attrs: {
        type: 'array',
        choices: ['identifier', 'status', 'cwd' ,'command', 'cmd', 'args'],
        group: 'Format:',
        desc: 'Select printed attributes'
      },
      headers: {
        type: 'boolean',
        group: 'Format:',
        desc: 'Prints columns headers'
      },
      long: {
        alias: 'l',
        type: 'boolean',
        conflicts: 'attrs',
        group: 'Format:',
        desc: 'Prints more data on each tasks',
      },
    }, commandHandler(listCommand))
    .demandCommand(1);
}