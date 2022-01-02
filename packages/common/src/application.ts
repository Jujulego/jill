import { logger } from '@jujulego/jill-core';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { Plugin } from './plugin';

// Types
export interface ApplicationArgs {
  plugins: string[];
  verbose: number;
}

// Class
export abstract class Application {
  // Methods
  /**
   * Setup application name and global options
   * @protected
   */
  protected setup() {
    return yargs(hideBin(process.argv))
      .scriptName(this.name)
      .parserConfiguration({
        'populate--': true,
      })
      .pkgConf(this.name)
      .option('plugins', {
        type: 'array',
        default: [] as string[],
        description: 'Plugins to load',
      })
      .option('verbose', {
        alias: 'v',
        type: 'count',
        description: 'Set verbosity level (1 for verbose, 2 for debug)',
      });
  }

  async parse(): Promise<void> {
    // Setup global options and parse once
    const parser = this.setup();
    const { verbose, plugins } = await parser.help(false).parse();

    // Setup logger verbosity
    if (verbose === 1) {
      logger.level = 'verbose';
    } else if (verbose >= 2) {
      logger.level = 'debug';
    }

    // Setup plugins
    this.corePlugin.setup(parser);

    for (const name of plugins) {
      const { default: plugin } = await import(name);

      if (plugin instanceof Plugin) {
        plugin.setup(parser);
        logger.verbose(`Plugin ${name} loaded`);
      } else {
        logger.warn(
          `Plugin ${name} failed to load.\n` +
          'It should default export (in ESM way) a Plugin instance'
        );
      }
    }

    // Parse to run command
    parser.strictCommands()
      .help();

    await parser.parse();
  }

  // Properties
  abstract get name(): string;
  abstract get corePlugin(): Plugin;
}
