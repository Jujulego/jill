import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { COMMAND } from '@/src/modules/command.js';
import { Logger } from '@/src/commons/logger.service.js';
import { applyConfigOptions } from '@/src/config/config-options.js';
import { CorePlugin } from '@/src/core.plugin.js';
import { container } from '@/src/inversify.config.js';
import { getModule } from '@/src/modules/module.js';
import { PluginLoaderService } from '@/src/modules/plugin-loader.service.js';

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

    // Options (for doc)
    applyConfigOptions(parser);

    // Load plugins
    container.load(getModule(CorePlugin, true));

    const pluginLoader = await container.getAsync(PluginLoaderService);
    await pluginLoader.loadPlugins();

    // Commands
    await parser
      .command(await container.getAllAsync(COMMAND) as any)
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
