import type { Job$ } from '@kyrielle/workload';
import type { Mutator } from 'kyrielle';
import type { Argv, CommandModule } from 'yargs';
import type { LoggerArgs } from '../middlewares/with-logger.js';
import { type PlanModeArgs, withPlan } from '../middlewares/with-plan.js';
import { trace } from '../utils/sentry.js';
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
        const parser = withPlan(base);

        if (module.builder) {
          return module.builder(parser);
        } else {
          return parser;
        }
      },
      async handler(args) {
        if (!args.plan) {
          job$.mutate(await prepare(args) ?? null);
        }
      }
    });
  } else {
    return command({
      ...module,
      handler: () => undefined
    });
  }
}

