import { Command, CommandBuilder } from '../command';

// Command
export abstract class BaseCommand extends Command {
  // Methods
  protected async define<U>(command: string | readonly string[], description: string, builder: CommandBuilder<U>) {
    const argv = await super.define(command, description, y => builder(y)
      .option('verbose', {
        alias: 'v',
        type: 'count',
        description: 'Set verbosity level (1 for verbose, 2 for debug)',
      })
    );

    // Manage log level
    if (argv.verbose === 1) {
      this.logger.level = 'verbose';
    } else if (argv.verbose >= 2) {
      this.logger.level = 'debug';
    }

    return argv;
  }
}