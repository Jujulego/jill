import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import pkg from '../package.json';
import { commands } from './commands';
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
    .wrap(process.stdout.columns);

  // Middlewares
  applyMiddlewares(parser, [globalConfig]);

  parser.middleware(() => {
    parser.command('test', 'test', {}, () => console.log('test'));
  });

  // Parse !
  await parser
    .command(commands as any)
    .demandCommand()
    .recommendCommands()
    .strict()
    .parse();
})();
