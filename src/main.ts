import chalk from 'chalk';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { COMMAND } from '@/src/modules/command';
import { applyConfigOptions } from '@/src/config/config-options';
import { CorePlugin } from '@/src/core.plugin';
import { container } from '@/src/inversify.config';
import { getModule } from '@/src/modules/module';
import { PluginLoaderService } from '@/src/modules/plugin-loader.service';
import { ExitException } from '@/src/utils/exit';

// @ts-ignore: Outside of typescript's rootDir in build
import pkg from '../package.json';

// Bootstrap
(async () => {
  // Setup yargs
  const parser = yargs(hideBin(process.argv))
    .scriptName('jill')
    .completion('completion', 'Generate bash completion script')
    .help('help', 'Show help for a command')
    .version('version', 'Show version', pkg.version)
    .wrap(process.stdout.columns);

  try {
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
      .fail(false)
      .parse();
  } catch (err) {
    if (err instanceof ExitException) {
      process.exit(err.code);
    } else {
      console.error(await parser.getHelp());
      console.error(chalk.red(err.message));

      process.exit(1);
    }
  }
})();
