import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';

import { EachCommand } from './commands/each.command';
import { InfoCommand } from './commands/info.command';
import { ListCommand } from './commands/list.command';
import { RunCommand } from './commands/run.command';
import { myrCommand } from './myr/command';
import { WatchCommand } from './myr/watch.command';

// Bootstrap
(async () => {
  // Options
  const parser = await yargs(hideBin(process.argv))
    .scriptName('jill')
    .parserConfiguration({
      'populate--': true,
    })
    .command('myr', 'Interact with myr server', myrCommand)
    .strictCommands()
    .help();

  const exit = Promise.race([
    (new InfoCommand(parser)).setup(),
    (new ListCommand(parser)).setup(),
    (new RunCommand(parser)).setup(),
    (new EachCommand(parser)).setup(),

    (new WatchCommand(parser)).setup()
  ]);

  await parser.parse();

  process.exit((await exit) ?? 0);
})();
