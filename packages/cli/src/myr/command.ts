import yargs from 'yargs';

import { killCommand } from './commands/kill';
import { listCommand } from './commands/list';
import { spawnCommand } from './commands/spawn';
import { stopCommand } from './commands/stop';
import { commandHandler } from '../wrapper';

// Command
export function myrCommand(yargs: yargs.Argv) {
  yargs
    .command(['list', 'ls'], 'List myr tasks', {
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
    .command('spawn <command>', 'Spawn new task', {
      workspace: {
        alias: 'w',
        type: 'string',
        desc: 'Workspace to use'
      }
    }, commandHandler(spawnCommand))
    .command('kill <id>', 'Kill task', {}, commandHandler(killCommand))
    .command('stop', 'Stop myr server. This will kill all running tasks', {}, commandHandler(stopCommand))
    .demandCommand(1);
}