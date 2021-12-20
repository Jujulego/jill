import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';

import { EachCommand } from './commands/each.command';
import { InfoCommand } from './commands/info.command';
import { ListCommand } from './commands/list.command';
import { RunCommand } from './commands/run.command';
import { MyrCommand } from './myr/myr.command';
import { WatchCommand } from './myr/watch.command';
import { Plugin } from './plugin';

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

  const core = Plugin.createPlugin('core', [
    InfoCommand,
    ListCommand,
    RunCommand,
    EachCommand,
  ]);

  const myr = Plugin.createPlugin('myr', [
    MyrCommand,
    WatchCommand,
  ]);

  core.setup(parser);
  myr.setup(parser);

  await parser.parse();
})();
