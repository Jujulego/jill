import yargs from 'yargs';

import { KillCommand } from './commands/kill.command';
import { listCommand } from './commands/list';
import { logsCommand } from './commands/logs';
import { spawnCommand } from './commands/spawn';
import { stopCommand } from './commands/stop';
import { commandHandler } from '../wrapper';

// Command
export function myrCommand(yargs: yargs.Argv){
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
    .command('logs', 'Request myr logs', {
      follow: {
        alias: 'f',
        type: 'boolean',
        default: false,
        description: 'Subscribe to logs stream'
      }
    }, commandHandler(logsCommand))
    .command('stop', 'Stop myr server. This will kill all running tasks', {}, commandHandler(stopCommand))
    .strictCommands();

  // Commands
  (new KillCommand(yargs)).run();
}