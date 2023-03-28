import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { COMMAND } from '@/src/modules/command';
import { Logger } from '@/src/commons/logger.service';
import { applyConfigOptions } from '@/src/config/config-options';
import { CorePlugin } from '@/src/core.plugin';
import { container } from '@/src/inversify.config';
import { getModule } from '@/src/modules/module';
import { PluginLoaderService } from '@/src/modules/plugin-loader.service';

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
      .command(await container.getAllAsync(COMMAND))
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
