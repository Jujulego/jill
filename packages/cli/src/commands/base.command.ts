import { Arguments } from 'yargs';

import { Builder, Command } from '../command';

// Types
export interface BaseArgs {
  verbose: number;
}

// Command
export abstract class BaseCommand<A extends BaseArgs> extends Command<BaseArgs> {
  // Methods
  protected define<T, U>(builder: Builder<T, U>): Builder<T, U & BaseArgs> {
    return y => builder(y)
      .option('verbose', {
        alias: 'v',
        type: 'count',
        description: 'Set verbosity level (1 for verbose, 2 for debug)',
      });
  }

  protected run(args: Arguments<A>): void | Promise<void> {
    // Setup logger verbosity
    if (args.verbose === 1) {
      this.logger.level = 'verbose';
    } else if (args.verbose >= 2) {
      this.logger.level = 'debug';
    }
  }
}