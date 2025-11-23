import { pipe$ } from 'kyrielle';
import yargs from 'yargs';
import { version } from '../package.json' with { type: 'json' };
import { withConfig } from './middlewares/with-config.js';
import { withLogger } from './middlewares/with-logger.js';

// Utils
export function cliParser() {
  return pipe$(
    yargs()
      .scriptName('jill')
      .version(version)
      .demandCommand()
      .recommendCommands(),
    withLogger,
    withConfig,
  );
}
