import chalk from 'chalk';
import { injectable } from 'inversify';
import winston from 'winston';

import { type GlobalConfig, GLOBAL_CONFIG, container } from './inversify.config';

// Constants
const VERBOSITY_LEVEL: Record<number, string> = {
  1: 'verbose',
  2: 'debug',
};

// Utils
export const consoleFormat = winston.format.combine(
  winston.format.errors(),
  winston.format.colorize({
    message: true,
    colors: { debug: 'grey', verbose: 'blue', info: 'white', error: 'red' }
  }),
  winston.format.printf(({ label, message, ms }) => {
    const lines = message.split('\n');

    // Format
    let spaces = '';
    let formatted = `${lines[0]} ${chalk.magenta(ms)}`;

    if (label) {
      spaces = ' '.repeat(label.length + 3);
      formatted = `${chalk.grey(`[${label}]`)} ${lines[0]} ${chalk.magenta(ms)}`;
    }

    for (let i = 1; i < lines.length; ++i) {
      formatted += `\n${spaces}${lines[i]}`;
    }

    return formatted;
  }),
);

// Service
@injectable()
export class Logger {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Logger extends winston.Logger {}

container.bind(Logger)
  .toDynamicValue((context) => {
    const config = context.container.get<GlobalConfig>(GLOBAL_CONFIG);

    return winston.createLogger({
      level: VERBOSITY_LEVEL[Math.min(config.verbose, 2)],
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
      ),
      transports: [
        new winston.transports.Console({
          format: consoleFormat
        })
      ]
    });
  })
  .inSingletonScope();
