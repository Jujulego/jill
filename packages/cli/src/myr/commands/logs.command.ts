import { Arguments, Builder, ProjectArgs, ProjectCommand } from '@jujulego/jill-common';
import { format } from 'winston';
import chalk from 'chalk';

import { MyrClient } from '../myr-client';

// Types
export interface LogsArgs extends ProjectArgs {
  follow: boolean;
}

// Utils
const printLog = format.combine(
  { transform: (info) => Object.assign(info, { [Symbol.for('level')]: info.level }) },
  { transform: (info) => Object.assign(info, { context: info.task?.substr(0, 8) || info.context }) },
  format.printf(({ context, message, timestamp }) => context
    ? chalk`[jill-myr] {white ${new Date(timestamp).toLocaleString()}} {grey [${context}]} ${message}`
    : chalk`[jill-myr] {white ${new Date(timestamp).toLocaleString()}} ${message}`
  ),
  format.colorize({ all: true }),
);

// Command
export class LogsCommand extends ProjectCommand<LogsArgs> {
  // Attributes
  readonly name = 'logs';
  readonly description = 'Request myr logs';

  // Methods
  protected define<T, U>(builder: Builder<T, U>): Builder<T, U & LogsArgs> {
    return super.define(y => builder(y)
      .option('follow', {
        alias: 'f',
        type: 'boolean',
        default: false,
        description: 'Subscribe to logs stream'
      })
    );
  }

  protected async run(args: Arguments<LogsArgs>): Promise<void> {
    await super.run(args);

    // Spawn task
    this.spinner.start('Connecting to myr');
    const client = new MyrClient(this.project);

    this.spinner.start('Requesting logs');
    const logs = await client.logs();
    this.spinner.stop();

    for (const log of logs) {
      printLog.transform(log);
      this.log(log[Symbol.for('message')]);
    }

    // Follow
    if (args.follow) {
      for await (const log of client.logs$()) {
        printLog.transform(log);
        this.log(log[Symbol.for('message')]);
      }
    }
  }
}
