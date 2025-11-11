import { inject$ } from '@kyrielle/injector';
import { captureException, startInactiveSpan, startSpan } from '@sentry/node';
import { pipe$ } from 'kyrielle';
import process from 'node:process';
import { hideBin } from 'yargs/helpers';
import * as commands from './commands.js';
import { ClientError } from './cli/utils/errors.js';
import { cliParser } from './parser.js';
import { LOGGER } from './tokens.js';
import { command } from './wrappers/command.js';
import { jobCommandExecute } from './wrappers/job-command-execute.js';

// Bootstrap
const argv = hideBin(process.argv);
const parser = pipe$(
  cliParser(),
  jobCommandExecute(commands.each),
  jobCommandExecute(commands.exec),
  command(commands.list),
  jobCommandExecute(commands.run),
  command(commands.tree),
);

void startSpan({ name: 'jill', op: 'cli.main', startTime: 0, attributes: { 'cli.argv': argv } }, async () => {
  try {
    startInactiveSpan({ name: 'bootstrap', op: 'cli.bootstrap', startTime: 0 })
      .end();

    return await parser
      .wrap(parser.terminalWidth())
      .fail((msg, err) => {
        const logger = inject$(LOGGER);

        if (msg) {
          logger.error(msg);
        } else if (err instanceof ClientError) {
          logger.error(err.message);
        } else {
          captureException(err, { tags: { handled: false } });
          logger.error(err.message);
        }

        process.exitCode = 1;
      })
      .parseAsync(argv);
  } catch {
    // Already handled
  }
});
