import type { TaskSet } from '@jujulego/tasks';
import { asyncScope$, inject$ } from '@kyrielle/injector';
import { withLabel } from '@kyrielle/logger';
import { var$ } from 'kyrielle';
import { ConfigService } from '../../config/config.service.js';
import { CWD, LOGGER } from '../../tokens.js';
import { instrument } from '../../utils/sentry.js';
import { planParser } from '../parser.js';

export class PlannerService {
  // Attributes
  private readonly _logger = inject$(LOGGER).child(withLabel('planner'));

  // Methods
  /**
   * Returns a task set if any task should be run by given command.
   * Tasks that do not execute tasks will return `null`
   */
  @instrument('PlannerService.plan')
  async plan(args: string[], cwd: string): Promise<TaskSet | null> {
    this._logger.debug(`interpreting jill ${args.join(' ')}`);

    const argv = args.map(arg => arg.replace(/^["'](.+)["']$/, '$1'));
    const tasks = var$<TaskSet>();

    await asyncScope$(async () => {
      asyncScope$().set(CWD, cwd);
      asyncScope$().set(ConfigService, new ConfigService()); // <= injects an empty ConfigService, forcing config discovery

      // await planParser(tasks).parseAsync(argv);
    });

    return tasks.defer() ?? null;
  }
}
