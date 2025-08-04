import process from 'node:process';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { version } from '../package.json' with { type: 'json' };
import { loggerMiddleware } from './cli/middlewares/logger.middleware.js';

// Bootstrap
const parser = yargs(hideBin(process.argv))
  .scriptName('jill')
  .version(version);

loggerMiddleware(parser);

await parser.parseAsync();
