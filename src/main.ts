import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { container } from '@/src/inversify.config';
import { Logger } from '@/src/commons/logger.service';
import { PluginLoaderService } from '@/src/plugins/plugin-loader.service';

import { commands } from './commands';
import { configOptions } from './middlewares/config-options';
import { applyMiddlewares } from './utils/yargs';

// @ts-ignore: Outside of typescript's rootDir in build
import pkg from '../package.json';

// Bootstrap
(async () => {
  try {
    // Setup yargs
    const parser = yargs(hideBin(process.argv))
      .scriptName('jill')
      .completion('completion', 'Generate bash completion script')
      .help('help', 'Show help for a command')
      .version('version', 'Show version', pkg.version)
      .wrap(process.stdout.columns);

    // Middlewares
    await applyMiddlewares(parser, [configOptions]);

    // Load plugins
    const pluginLoader = await container.getAsync(PluginLoaderService);
    await pluginLoader.loadPlugins(parser);

    // Commands
    await parser
      .command(commands as any)
      .demandCommand()
      .recommendCommands()
      .strict()
      .parse();
  } catch (err) {
    const logger = container.get(Logger);
    logger.error(err);

    process.exit(1);
  }
})();
