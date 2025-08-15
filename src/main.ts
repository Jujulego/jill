import { pipe$ } from 'kyrielle';
import process from 'node:process';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { version } from '../package.json' with { type: 'json' };
import { command } from './cli/bases/command-module.js';
import { executeCommand } from './cli/bases/task-module.js';
import * as commands from './cli/commands.js';
import { configMiddleware } from './cli/middlewares/config.middleware.js';
import { loggerMiddleware } from './cli/middlewares/logger.middleware.js';
import 'reflect-metadata/lite';

// Bootstrap
const parser = pipe$(
  yargs(hideBin(process.argv))
    .scriptName('jill')
    .version(version)
    .strictCommands()
    .demandCommand()
    .recommendCommands(),
  loggerMiddleware,
  configMiddleware,
  executeCommand(commands.exec),
  command(commands.list),
  command(commands.tree)
);

await parser.parseAsync();
