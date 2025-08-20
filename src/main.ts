import { captureException, startSpan } from '@sentry/node';
import { hideBin } from 'yargs/helpers';
import { executeParser } from './cli/parser.js';

// Bootstrap
const argv = hideBin(process.argv);

await startSpan({ name: 'jill', op: 'cli.main', attributes: { 'cli.argv': argv } }, async () => {
  const parser = executeParser();

  await parser
    .wrap(parser.terminalWidth())
    .fail((msg, err) => {
      captureException(err);

      parser.showHelp('error');
      console.error('');
    })
    .parseAsync(argv);
});
