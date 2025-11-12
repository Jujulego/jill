import { inject$ } from '@kyrielle/injector';
import process from 'node:process';
import type { Argv } from 'yargs';
import { LOGGER } from '../tokens.js';
import { trace, traceImport } from '../utils/sentry.js';
import type { LoggerArgs } from '../middlewares/logger.js';
import { commandName } from '../utils/yargs.js';
import { command } from './command.js';
import { type JobCommandModule } from './job-command.js';
import { type PlanModeArgs, withPlanMode } from './job-command-plan.js';

export function jobCommandExecute<T extends LoggerArgs, U extends PlanModeArgs>(module: JobCommandModule<U>) {
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
        const { printPlan } = await traceImport('printPlan', () => import('../cli/plans/print-plan.js'));
        printPlan(job);
      } else {
        if (execute) {
          await execute(args, job);
        } else {
          const { JobCommandExecuteInk } = await traceImport('JobCommandExecuteInk', () => import('./job-command-execute.ink.jsx'));
          await JobCommandExecuteInk({ job, verbose: ['verbose', 'debug'].includes(args.verbose) });
        }
      }
    }
  });
}