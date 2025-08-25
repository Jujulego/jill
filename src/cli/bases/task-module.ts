import { plan, type TaskSet } from '@jujulego/tasks';
import { inject$ } from '@kyrielle/injector';
import type { Mutator } from 'kyrielle';
import process from 'node:process';
import type { ArgumentsCamelCase, Argv, CommandModule } from 'yargs';
import { LOGGER } from '../../tokens.js';
import { printJson } from '../../utils/json.js';
import { trace, traceImport } from '../../utils/sentry.js';
import type { LoggerArgs } from '../middlewares/logger.js';
import { command } from './command-module.js';

// Module
export interface TaskModule<T extends PlanModeArgs = PlanModeArgs> extends Omit<CommandModule<PlanModeArgs, T>, 'builder' | 'handler'> {
  builder?: (args: Argv<PlanModeArgs>) => Argv<T>,

  /**
   * Generates tasks to be run, but do not execute them.
   */
  prepare(this: void, args: ArgumentsCamelCase<T>): Promise<TaskSet> | TaskSet;

  /**
   * Allows to override default "execute" behavior
   */
  execute?: (this: void, args: ArgumentsCamelCase<T>, tasks: TaskSet) => Promise<void> | void;
}

// Utils
export function executeCommand<T extends LoggerArgs, U extends PlanModeArgs>(module: TaskModule<U>) {
  const prepare = trace(module.prepare, 'cli.prepare');
  const execute = module.execute && trace(module.execute, 'cli.execute');

  return command<T, U>({
    ...module,
    builder(base) {
      const parser = withPlanMode(base);

      if (module.builder) {
        return module.builder(parser);
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
          const { default: TaskPlanInk } = await traceImport('TaskPlanInk', () => import('./task-plan.ink.jsx'));
          await TaskPlanInk({ tasks });
        }
      } else {
        if (execute) {
          await execute(args, tasks);
        } else if (tasks.tasks.length > 0) {
          const { default: TaskExecInk } = await traceImport('TaskExecInk', () => import('./task-exec.ink.jsx'));
          await TaskExecInk({ tasks, verbose: ['verbose', 'debug'].includes(args.verbose) });
        } else {
          const logger = inject$(LOGGER);
          logger.warning('No task found');
          process.exitCode = 1;
        }
      }
    }
  });
}

export function planCommand<T, U>(module: CommandModule<T, U>, tasks$: Mutator<TaskSet>): <V extends T>(parser: Argv<V>) => Argv<V>;
export function planCommand<T extends PlanModeArgs>(module: TaskModule<T>, tasks$: Mutator<TaskSet>): <V extends LoggerArgs>(parser: Argv<V>) => Argv<V>;
export function planCommand(module: CommandModule | TaskModule, tasks$: Mutator<TaskSet>) {
  if ('prepare' in module) {
    const prepare = trace(module.prepare, 'cli.prepare');

    return command<LoggerArgs, PlanModeArgs>({
      ...module,
      builder(base) {
        const parser = withPlanMode(base);

        if (module.builder) {
          return module.builder(parser);
        } else {
          return parser;
        }
      },
      async handler(args) {
        tasks$.mutate(await prepare(args));
      }
    });
  } else {
    return command({
      ...module,
      handler: () => undefined
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
