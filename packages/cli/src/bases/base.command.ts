import { Command, Flags } from '@oclif/core';

import { logger } from '../logger';

// Command
export default abstract class BaseCommand extends Command {
  // Statics
  static flags = {
    verbosity: Flags.enum({
      char: 'v',
      default: 'info',
      options: ['warn', 'info', 'verbose', 'debug']
    }),
  }

  // Methods
  protected async init() {
    const { flags } = await this.parse(this.constructor as typeof BaseCommand);

    logger.level = flags.verbosity;
  }

  protected async finally(_?: Error): Promise<void> {
    logger.stop();

    return await super.finally(_);
  }
}