import type { Job$ } from '@jujulego/tasks';
import { type Mutator, pipe$ } from 'kyrielle';
import yargs from 'yargs';
import { version } from '../../package.json' with { type: 'json' };
import { command } from './bases/command-module.js';
import { executeCommand, planCommand } from './bases/job-module.js';
import * as commands from './commands.js';
import { withConfig } from './middlewares/config.js';
import { withLogger } from './middlewares/logger.js';

// Utils
function baseParser() {
  return pipe$(
    yargs()
      .scriptName('jill')
      .version(version)
      .demandCommand()
      .recommendCommands(),
    withLogger,
    withConfig,
  );
}

/**
 * Prepare parser executing commands
 */
export function executeParser() {
  return pipe$(
    baseParser(),
    // executeCommand(commands.each),
    executeCommand(commands.exec),
    command(commands.list),
    // executeCommand(commands.run),
    command(commands.tree),
  );
}

/**
 * Prepare parser planning commands
 */
export function planParser(job$: Mutator<Job$ | null>) {
  return pipe$(
    baseParser(),
    // planCommand(commands.each, tasks$),
    // planCommand(commands.exec, tasks$),
    planCommand(commands.list, job$),
    // planCommand(commands.run, tasks$),
    // planCommand(commands.tree, tasks$),
  );
}
