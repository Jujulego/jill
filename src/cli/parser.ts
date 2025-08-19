import type { TaskSet } from '@jujulego/tasks';
import { type Mutator, pipe$ } from 'kyrielle';
import process from 'node:process';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { version } from '../../package.json' with { type: 'json' };
import { command } from './bases/command-module.js';
import { executeCommand, planCommand } from './bases/task-module.js';
import * as commands from './commands.js';
import { configMiddleware } from './middlewares/config.middleware.js';
import { loggerMiddleware } from './middlewares/logger.middleware.js';

// Utils
function baseParser() {
  return pipe$(
    yargs(hideBin(process.argv))
      .scriptName('jill')
      .version(version)
      .demandCommand()
      .recommendCommands(),
    loggerMiddleware,
    configMiddleware,
  );
}

/**
 * Prepare parser executing commands
 */
export function executeParser() {
  return pipe$(
    baseParser(),
    executeCommand(commands.each),
    executeCommand(commands.exec),
    command(commands.list),
    executeCommand(commands.run),
    command(commands.tree),
  );
}

/**
 * Prepare parser planning commands
 */
export function planParser(tasks$: Mutator<TaskSet>) {
  return pipe$(
    baseParser(),
    planCommand(commands.each, tasks$),
    planCommand(commands.exec, tasks$),
    planCommand(commands.list, tasks$),
    planCommand(commands.run, tasks$),
    planCommand(commands.tree, tasks$),
  );
}
