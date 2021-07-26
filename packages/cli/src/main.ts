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
      description: 'Project root directory'
    })
    .option('verbose', {
      alias: 'v',
      type: 'count',
      description: 'Set verbosity level (1 for verbose, 2 for debug)',
    })
      .parserConfiguration({
          'populate--': true,
      })
    .command(require('./commands/list')) // eslint-disable-line @typescript-eslint/no-var-requires
    .command(require('./commands/info')) // eslint-disable-line @typescript-eslint/no-var-requires
    .command(require('./commands/build')) // eslint-disable-line @typescript-eslint/no-var-requires
    .command(require('./commands/run')) // eslint-disable-line @typescript-eslint/no-var-requires
    .command(require('./commands/each')) // eslint-disable-line @typescript-eslint/no-var-requires
    .demandCommand(1)
    .help()
    .example('$0 list -a', 'List all affected workspaces towards master branch')
    .example('$0 list --no-private', 'List all public workspaces')
    .parse();
})();
