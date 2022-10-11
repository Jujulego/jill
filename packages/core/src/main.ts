import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import pkg from '../package.json';
import { container, GLOBAL_CONFIG } from './services';
import { Git } from './git';

try {
  // Setup yargs
  let parser = yargs(hideBin(process.argv))
    .scriptName('jill')
    .completion('completion', 'Generate bash completion script')
    .help('help', 'Show help for a command')
    .version('version', 'Show version', pkg.version);

  // Global config
  parser = parser
    .option('verbose', {
      alias: 'v',
      type: 'count',
      description: 'Set verbosity level',
    })
    .option('jobs', {
      alias: 'j',
      type: 'number',
      description: 'Set maximum parallel job number',
    })
    .middleware((config) => {
      container.bind(GLOBAL_CONFIG).toConstantValue(config);
    });

  // Parse !
  parser
    .command('toto', 'toto', {}, async () => {
      const branches = await Git.listBranches();
      console.log(branches);
    })
    .demandCommand()
    .recommendCommands()
    .strict()
    .parse();
} catch (err) {
  console.error(err);
  process.exit(1);
}
