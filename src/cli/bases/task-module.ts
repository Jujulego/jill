import { plan, type TaskSet } from '@jujulego/tasks';
import { inject$ } from '@kyrielle/injector';
import type { Mutator } from 'kyrielle';
import type { ArgumentsCamelCase, Argv, CommandModule } from 'yargs';
import { LOGGER } from '../../tokens.js';
import { printJson } from '../../utils/json.js';
import type { LoggerArgs } from '../middlewares/logger.middleware.js';
import { command } from './command-module.js';

// Module
export interface TaskModule<T extends PlanModeArgs> extends Omit<CommandModule<PlanModeArgs, T>, 'builder' | 'handler'> {
  builder?: (args: Argv<PlanModeArgs>) => Argv<T>,

  /**
   * Generates tasks to be run, but do not execute them.
   */
  prepare(this: void, args: ArgumentsCamelCase<T>): Promise<TaskSet> | TaskSet;
}

// Utils
export function executeCommand<T extends LoggerArgs, U extends PlanModeArgs>(module: TaskModule<U>) {
  const { prepare, ...rest } = module;

  return command<T, U>({
    ...rest,
    builder(base) {
      const parser = withPlanMode(base);

      if (rest.builder) {
        return rest.builder(parser);
      } else {
        return parser as Argv<U>;
      }
    },
    async handler(args) {
      const tasks = await prepare(args);

      if (args.plan) {
        if (args.planMode === 'json') {
          printJson(Array.from(plan(tasks)));
        } else {
          const { default: TaskPlanInk } = await import('./task-plan.ink.jsx');
          await TaskPlanInk({ tasks });
        }
      } else if (tasks.tasks.length > 0) {
        const { default: TaskExecInk } = await import('./task-exec.ink.jsx');
        await TaskExecInk({ tasks, verbose: ['verbose', 'debug'].includes(args.verbose) });
      } else {
        const logger = inject$(LOGGER);
        logger.warning('No task found');
      }
    }
  });
}

export function planCommand<T extends LoggerArgs, U extends PlanModeArgs>(module: CommandModule<T, U> | TaskModule<U>, tasks$: Mutator<TaskSet>) {
  if ('prepare' in module) {
    const { prepare, ...rest } = module;

    return command<T, U>({
      ...rest,
      builder(base) {
        const parser = withPlanMode(base);

        if (rest.builder) {
          return rest.builder(parser);
        } else {
          return parser as Argv<U>;
        }
      },
      async handler(args) {
        tasks$.mutate(await prepare(args));
      }
    });
  } else {
    return command<T, U>({
      ...module,
      handler: () => null, // <= prevents command execution
    });
  }
}

// Types
export interface PlanModeArgs extends LoggerArgs {
  readonly plan: boolean;
  readonly 'plan-mode': 'json' | 'list';
}


// Utils
export function withPlanMode<T>(parser: Argv<T>) {
  return parser
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
}
