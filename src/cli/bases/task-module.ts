import type { TaskSet } from '@jujulego/tasks';
import type { ArgumentsCamelCase, CommandModule } from 'yargs';
import type { LoggerArgs } from '../middlewares/logger.middleware.js';
import { command } from './command-module.js';

// Module
export interface TaskModule<T extends LoggerArgs> extends Omit<CommandModule<LoggerArgs, T>, 'handler'> {
  /**
   * Generates tasks to be run, but do not execute them.
   */
  prepare(this: void, args: ArgumentsCamelCase<T>): Promise<TaskSet> | TaskSet;
}

// Utils
export function executeCommand<T extends LoggerArgs>(module: TaskModule<T>) {
  const { prepare, ...rest } = module;

  return command<LoggerArgs, T>({
    ...rest,
    async handler(args) {
      const tasks = await prepare(args);

      const { default: TaskModuleInk } = await import('./task-module.ink.jsx');
      await TaskModuleInk({ tasks, verbose: ['verbose', 'debug'].includes(args.verbose) });
    }
  });
}
