import { type Job$ } from '@jujulego/tasks';
import type { ArgumentsCamelCase, Argv, CommandModule } from 'yargs';
import type { Awaitable } from '../utils/types.js';

import type { PlanModeArgs } from '../middlewares/with-plan.js';

// Module
export interface JobCommandModule<T extends PlanModeArgs = PlanModeArgs> extends Omit<CommandModule<PlanModeArgs, T>, 'builder' | 'handler'> {
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

