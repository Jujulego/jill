import { Command, Options } from '../command';

// Command
export abstract class BaseCommand extends Command {
  // Methods
  async define<O extends Options>(command: string | ReadonlyArray<string>, description: string, options: O) {
    const argv = await super.define(command, description, {
      ...options,
      verbose: {
        alias: 'v',
        type: 'count',
        description: 'Set verbosity level (1 for verbose, 2 for debug)',
      }
    });

    // Manage log level
    if (argv.verbose === 1) {
      this.logger.level = 'verbose';
    } else if (argv.verbose >= 2) {
      this.logger.level = 'debug';
    }

    return argv;
  }
}