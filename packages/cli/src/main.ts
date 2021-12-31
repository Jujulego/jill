import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';

import { corePlugin } from './core.plugin';

// Bootstrap
(async () => {
  // Options
  const parser = await yargs(hideBin(process.argv))
    .scriptName('jill')
    .parserConfiguration({
      'populate--': true,
    })
    .strictCommands()
    .help();

  const { default: myrPlugin } = await import('@jujulego/jill-myr');

  corePlugin.setup(parser);
  myrPlugin.setup(parser);

  await parser.parse();
})();
