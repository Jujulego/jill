import { inject$ } from '@kyrielle/injector';
import { captureException, startSpan } from '@sentry/node';
import process from 'node:process';
import { hideBin } from 'yargs/helpers';
import { executeParser } from './cli/parser.js';
import { ClientError } from './cli/utils/errors.js';
import { LOGGER } from './tokens.js';

// Bootstrap
const argv = hideBin(process.argv);
const parser = executeParser();

void startSpan({ name: 'jill', op: 'cli.main', startTime: 0, attributes: { 'cli.argv': argv } }, () => parser
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
  .parseAsync(argv)
  .catch(() => {})
);
