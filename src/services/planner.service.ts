import type { Job$ } from '@jujulego/tasks';
import { asyncScope$, inject$ } from '@kyrielle/injector';
import { withLabel } from '@kyrielle/logger';
import { pipe$, var$ } from 'kyrielle';
import * as commands from '../commands.js';
import { ConfigService } from '../config/config.service.js';
import { cliParser } from '../parser.js';
import { CWD, LOGGER } from '../tokens.js';
import { instrument } from '../utils/sentry.js';
import { jobCommandPlan } from '../wrappers/job-command-plan.js';

export class PlannerService {
  // Attributes
  private readonly _logger = inject$(LOGGER).child(withLabel('planner'));

  // Methods
  /**
   * Returns a task set if any task should be run by given command.
   * Tasks that do not execute tasks will return `null`
   */
  @instrument('PlannerService.plan')
  async plan(args: string[], cwd: string): Promise<Job$ | null> {
    this._logger.debug(`interpreting jill ${args.join(' ')}`);

    const argv = args.map(arg => arg.replace(/^["'](.+)["']$/, '$1'));
    const job$ = var$<Job$ | null>(null);

    await asyncScope$(async () => {
      asyncScope$().set(CWD, cwd);
      asyncScope$().set(ConfigService, new ConfigService()); // <= injects an empty ConfigService, forcing config discovery

      const parser = pipe$(
        cliParser(),
        jobCommandPlan(commands.each, job$),
        jobCommandPlan(commands.exec, job$),
        jobCommandPlan(commands.list, job$),
        jobCommandPlan(commands.run, job$),
        jobCommandPlan(commands.tree, job$),
      );

      await parser.parseAsync(argv);
    });

    return job$.defer() ?? null;
  }
}
