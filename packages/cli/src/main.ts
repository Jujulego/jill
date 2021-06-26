import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';

// Bootstrap
(async () => {
  // Options
  await yargs(hideBin(process.argv))
    .scriptName('jill')
    .option('project', {
      alias: 'p',
      type: 'string',
      description: 'Project root directory',
      default: '.'
    })
    .option('verbose', {
      alias: 'v',
      type: 'count',
      description: 'Set verbosity level (1 for verbose, 2 for debug)',
    })
    .command(require('./commands/info')) // eslint-disable-line @typescript-eslint/no-var-requires
    .command(require('./commands/build')) // eslint-disable-line @typescript-eslint/no-var-requires
    .demandCommand(1)
    .help()
    .parse();
})();
