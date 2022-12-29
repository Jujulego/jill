import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { commands } from './commands';
import { configOptions } from './middlewares';
import { applyMiddlewares } from './utils';

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

  // Middlewares
  applyMiddlewares(parser, [configOptions]);

  // Parse !
  await parser
    .command(commands as any)
    .demandCommand()
    .recommendCommands()
    .strict()
    .parse();
})();
