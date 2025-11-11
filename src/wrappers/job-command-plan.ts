import type { Job$ } from '@jujulego/tasks';
import type { Mutator } from 'kyrielle';
import type { Argv, CommandModule } from 'yargs';
import { trace } from '../utils/sentry.js';
import type { LoggerArgs } from '../cli/middlewares/logger.js';
import { commandName } from '../utils/yargs.js';
import { command } from './command.js';
import type { JobCommandModule } from './job-command.js';

export function jobCommandPlan<T, U>(module: CommandModule<T, U>, job$: Mutator<Job$ | null>): <V extends T>(parser: Argv<V>) => Argv<V>;
export function jobCommandPlan<T extends PlanModeArgs>(module: JobCommandModule<T>, job$: Mutator<Job$ | null>): <V extends LoggerArgs>(parser: Argv<V>) => Argv<V>;
export function jobCommandPlan(module: CommandModule | JobCommandModule, job$: Mutator<Job$ | null>) {
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