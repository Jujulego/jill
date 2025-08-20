import { captureException } from '@sentry/node';
import { executeParser } from './cli/parser.js';

// Bootstrap
const parser = executeParser();

await parser
  .wrap(parser.terminalWidth())
  .fail((msg, err) => {
    captureException(err);

    parser.showHelp('error');
    console.error('');
  })
  .parseAsync();
