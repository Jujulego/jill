import { format } from 'winston';
import chalk from 'chalk';

import { ProjectCommand } from '../../commands/project.command';
import { MyrClient } from '../myr-client';

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
export class LogsCommand extends ProjectCommand {
  // Methods
  async run(): Promise<void> {
    // Define command
    const argv = await this.define('logs', 'Request myr logs', y => y
      .options({
        follow: {
          alias: 'f',
          type: 'boolean',
          default: false,
          description: 'Subscribe to logs stream'
        }
      })
    );

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
    if (argv.follow) {
      for await (const log of client.logs$()) {
        printLog.transform(log);
        this.log(log[Symbol.for('message')]);
      }
    }
  }
}