import process from 'node:process';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { version } from '../package.json' with { type: 'json' };
import { executeCommand } from './cli/bases/task-module.js';
import * as commands from './cli/commands.js';
import { configMiddleware } from './cli/middlewares/config.middleware.js';
import { loggerMiddleware } from './cli/middlewares/logger.middleware.js';
import 'reflect-metadata/lite';

// Bootstrap
const parser = yargs(hideBin(process.argv))
  .scriptName('jill')
  .version(version);

loggerMiddleware(parser)
  .command(executeCommand(commands.exec));

configMiddleware(parser);

parser.strictCommands()
  .command(commands.list)
  .command(commands.tree)
  .demandCommand()
  .recommendCommands();

await parser.parseAsync();
