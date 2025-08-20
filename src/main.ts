import { captureException, captureMessage, startSpan } from '@sentry/node';
import { hideBin } from 'yargs/helpers';
import { executeParser } from './cli/parser.js';

// Bootstrap
const argv = hideBin(process.argv);
const parser = executeParser();

await startSpan({ name: 'jill', op: 'cli.main', attributes: { 'cli.argv': argv } }, () => parser
  .wrap(parser.terminalWidth())
  .fail((msg, err) => {
    if (msg) {
      captureMessage(msg, 'fatal');
    } else {
      captureException(err);
    }
  })
  .parseAsync(argv)
);
