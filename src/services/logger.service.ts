import chalk from 'chalk';
import { injectable } from 'inversify';
import winston from 'winston';

import { container } from './inversify.config';

// Utils
export const consoleFormat = winston.format.combine(
  winston.format.errors(),
  winston.format.colorize({
    message: true,
    colors: { debug: 'grey', verbose: 'blue', info: 'white', error: 'red' }
  }),
  winston.format.printf(({ label, message }) => {
    const lines = message.split('\n');

    // Format
    let spaces = '';
    let formatted = lines[0];

    if (label) {
      spaces = ' '.repeat(label.length + 3);
      formatted = `${chalk.grey(`[${label}]`)} ${lines[0]}`;
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
  .toDynamicValue(() => {
    return winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
      ),
      transports: [
        new winston.transports.Console({
          format: consoleFormat
        })
      ]
    });
  })
  .inSingletonScope();
