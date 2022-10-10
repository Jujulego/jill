import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import pkg from '../package.json';
import { manager } from './tasks';
import { logger } from './logger';

try {
  yargs(hideBin(process.argv))
    .scriptName('jill')
    .completion('completion', 'Generate bash completion script')
    .help('help', 'Show help for a command')
    .version('version', 'Show version', pkg.version)
    .option('verbose', {
      alias: 'v',
      type: 'count',
      description: 'Set verbosity level',
    })
    .middleware(({ verbose }) => {
      if (verbose === 1) {
        logger.level = 'verbose';
      } else if (verbose >= 2) {
        logger.level = 'debug';
      }
    })
    .option('jobs', {
      alias: 'j',
      type: 'number',
      description: 'Set maximum parallel job number',
    })
    .middleware(({ jobs }) => {
      if (jobs) {
        manager.jobs = jobs;
      }
    })
    .demandCommand()
    .recommendCommands()
    .strict()
    .parse();
} catch (err) {
  console.error(err);
  process.exit(1);
}
