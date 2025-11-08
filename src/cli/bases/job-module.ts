import { type Job$ } from '@jujulego/tasks';
import { inject$ } from '@kyrielle/injector';
import type { Mutator } from 'kyrielle';
import process from 'node:process';
import type { ArgumentsCamelCase, Argv, CommandModule } from 'yargs';
import { LOGGER } from '../../tokens.js';
import { trace, traceImport } from '../../utils/sentry.js';
import type { Awaitable } from '../../utils/types.js';
import type { LoggerArgs } from '../middlewares/logger.js';
import { printPlan } from '../utils/plan.js';
import { command, commandName } from './command.js';

// Module
export interface JobModule<T extends PlanModeArgs = PlanModeArgs> extends Omit<CommandModule<PlanModeArgs, T>, 'builder' | 'handler'> {
  builder?: (args: Argv<PlanModeArgs>) => Argv<T>,

  /**
   * Generates tasks to be run, but do not execute them.
   */
  prepare(this: void, args: ArgumentsCamelCase<T>): Awaitable<Job$ | void>;

  /**
   * Allows to override default "execute" behavior
   */
  execute?: (this: void, args: ArgumentsCamelCase<T>, job: Job$ | null) => Promise<void> | void;
}

// Utils
export function executeCommand<T extends LoggerArgs, U extends PlanModeArgs>(module: JobModule<U>) {
  const prepare = trace(module.prepare, { name: commandName(module), op: 'cli.prepare' });
  const execute = module.execute && trace(module.execute, { name: commandName(module), op: 'cli.execute' });

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
      const job = await prepare(args) ?? null;

      if (!job) {
        const logger = inject$(LOGGER);
        logger.warning('No task found');
        process.exitCode = 1;

        return;
      }

      if (args.plan) {
        printPlan(job);
      } else {
        if (execute) {
          await execute(args, job);
        } else {
          const { default: JobExecInk } = await traceImport('JobExecInk', () => import('./job-exec.ink.jsx'));
          await JobExecInk({ job, verbose: ['verbose', 'debug'].includes(args.verbose) });
        }
      }
    }
  });
}

export function planCommand<T, U>(module: CommandModule<T, U>, job$: Mutator<Job$ | null>): <V extends T>(parser: Argv<V>) => Argv<V>;
export function planCommand<T extends PlanModeArgs>(module: JobModule<T>, job$: Mutator<Job$ | null>): <V extends LoggerArgs>(parser: Argv<V>) => Argv<V>;
export function planCommand(module: CommandModule | JobModule, job$: Mutator<Job$ | null>) {
  if ('prepare' in module) {
    const prepare = trace(module.prepare, { name: commandName(module), op: 'cli.prepare' });

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
        job$.mutate(await prepare(args) ?? null);
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
