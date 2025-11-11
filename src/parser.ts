import { pipe$ } from 'kyrielle';
import yargs from 'yargs';
import { version } from '../package.json' with { type: 'json' };
import { withConfig } from './cli/middlewares/config.js';
import { withLogger } from './cli/middlewares/logger.js';

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
