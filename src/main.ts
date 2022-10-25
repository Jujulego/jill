import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import pkg from '../package.json';
import { globalConfig } from './middlewares';
import { applyMiddlewares } from './utils';

// Bootstrap
(async () => {
  // Setup yargs
  const parser = yargs(hideBin(process.argv))
    .scriptName('jill')
    .completion('completion', 'Generate bash completion script')
    .help('help', 'Show help for a command')
    .version('version', 'Show version', pkg.version)
    .wrap(yargs.terminalWidth());

  // Middlewares
  applyMiddlewares(parser, [globalConfig]);

  // Parse !
  await parser
    .commandDir('commands', {
      visit: obj => obj.default
    })
    .demandCommand()
    .recommendCommands()
    .strict()
    .parse();
})();
