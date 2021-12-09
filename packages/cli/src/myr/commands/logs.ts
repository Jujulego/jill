import chalk from 'chalk';
import { format } from 'winston';

import { logger } from '../../logger';
import { MyrClient } from '../myr-client';
import { CommandHandler } from '../../wrapper';

// Args
export interface LogsArgs {
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
export const logsCommand: CommandHandler<LogsArgs> = async (prj, argv) => {
  // Spawn task
  logger.spin('Connecting to myr');
  const client = new MyrClient(prj);

  logger.spin('Requesting logs');
  const logs = await client.logs();
  logger.stop();

  for (const log of logs) {
    printLog.transform(log);
    console.log(log[Symbol.for('message')]);
  }

  // Follow
  if (argv.follow) {
    for await (const log of client.logs$()) {
      printLog.transform(log);
      console.log(log[Symbol.for('message')]);
    }
  }

  return 0;
};