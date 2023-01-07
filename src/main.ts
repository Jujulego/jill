import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { COMMAND } from '@/src/bases/command';
import { Logger } from '@/src/commons/logger.service';
import { applyConfigOptions } from '@/src/config/config-options';
import { container } from '@/src/inversify.config';
import { PluginLoaderService } from '@/src/plugins/plugin-loader.service';

import { commands } from './commands';

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
    const pluginLoader = await container.getAsync(PluginLoaderService);
    await pluginLoader.loadPlugins(parser);

    // Commands
    const cmds = await container.getAllAsync(COMMAND);

    await parser
      .command([...commands, ...cmds] as any)
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
