import chalk from 'chalk';
import winston, { type LogEntry } from 'winston';
import { BroadcastChannel, isMainThread } from 'node:worker_threads';

import { container } from '@/src/inversify.config';

import { ThreadTransport } from './logger/thread.transport';

// Utils
export const consoleFormat = winston.format.combine(
  winston.format.colorize({
    message: true,
    colors: { debug: 'grey', verbose: 'blue', info: 'white', error: 'red' }
  }),
  winston.format.printf(({ label, message, stack }) => {
    if (stack) message = chalk.red(stack);
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
export class Logger {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Logger extends winston.Logger {}

container.bind(Logger)
  .toDynamicValue(() => {
    const logger = winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({
          stack: process.env.NODE_ENV === 'development'
        }),
      ),
      transports: []
    });

    if (isMainThread) {
      logger.add(
        new winston.transports.Console({
          format: consoleFormat
        })
      );

      const channel = new BroadcastChannel('jujulego:jill:logger');
      channel.onmessage = (entry) => logger.log(entry as LogEntry);
      channel.unref();
    } else {
      logger.add(new ThreadTransport('jujulego:jill:logger'));
    }

    return logger;
  })
  .inSingletonScope();
