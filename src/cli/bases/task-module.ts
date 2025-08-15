import type { TaskSet } from '@jujulego/tasks';
import type { ArgumentsCamelCase, Argv, CommandModule } from 'yargs';
import type { LoggerArgs } from '../middlewares/logger.middleware.js';
import { command } from './command-module.js';

// Module
export interface TaskModule<T extends TaskModuleArgs> extends Omit<CommandModule<TaskModuleArgs, T>, 'builder' | 'handler'> {
  builder?: (args: Argv<TaskModuleArgs>) => Argv<T>,

  /**
   * Generates tasks to be run, but do not execute them.
   */
  prepare(this: void, args: ArgumentsCamelCase<T>): Promise<TaskSet> | TaskSet;
}

// Utils
export function executeCommand<T extends TaskModuleArgs>(module: TaskModule<T>) {
  const { prepare, ...rest } = module;

  return command<LoggerArgs, T>({
    ...rest,
    builder(base) {
      const parser = base
        .option('plan', {
          type: 'boolean',
          default: false,
          describe: 'Only prints tasks to be run',
        })
        .option('plan-mode', {
          type: 'string',
          desc: 'Plan output mode',
          choices: ['json', 'list'] as const,
          default: 'list' as const
        });

      if (rest.builder) {
        return rest.builder(parser);
      } else {
        return parser as Argv<T>;
      }
    },
    async handler(args) {
      const tasks = await prepare(args);

      const { default: TaskModuleInk } = await import('./task-module.ink.jsx');
      await TaskModuleInk({ tasks, verbose: ['verbose', 'debug'].includes(args.verbose) });
    }
  });
}

// Types
export interface TaskModuleArgs extends LoggerArgs {
  readonly plan: boolean;
  readonly 'plan-mode': 'json' | 'list';
}
