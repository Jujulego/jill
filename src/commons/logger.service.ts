import { type ILogger } from '@jujulego/tasks';
import chalk from 'chalk';
import { injectable } from 'inversify';
import winston, { type LogEntry } from 'winston';
import wt from 'node:worker_threads';

import { container } from '@/src/inversify.config';

import { ThreadTransport } from './logger/thread.transport';
import { $log } from '@/src/commons/logger/log.tag';

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
@injectable()
export class Logger implements ILogger {
  // Constructor
  constructor(
    private _logger: winston.Logger
  ) {}

  // Methods
  log(level: string, msg: string): void {
    this._logger.log(level, msg);
  }

  debug(msg: string): void;
  debug(strings: TemplateStringsArray, ...args: unknown[]): void;
  debug(msg: TemplateStringsArray | string, ...args: unknown[]): void {
    if (typeof msg !== 'string') {
      msg = $log(msg, ...args);
    }

    this._logger.debug(msg);
  }

  verbose(msg: string): void;
  verbose(strings: TemplateStringsArray, ...args: unknown[]): void;
  verbose(msg: TemplateStringsArray | string, ...args: unknown[]): void {
    if (typeof msg !== 'string') {
      msg = $log(msg, ...args);
    }

    this._logger.verbose(msg);
  }

  info(msg: string): void;
  info(strings: TemplateStringsArray, ...args: unknown[]): void;
  info(msg: TemplateStringsArray | string, ...args: unknown[]): void {
    if (typeof msg !== 'string') {
      msg = $log(msg, ...args);
    }

    this._logger.info(msg);
  }

  warn(msg: string, cause?: unknown): void;
  warn(strings: TemplateStringsArray, ...args: unknown[]): void;
  warn(msg: TemplateStringsArray | string, ...args: unknown[]): void {
    let cause = undefined;

    if (typeof msg !== 'string') {
      msg = $log(msg, ...args);
    } else {
      cause = args[0];
    }

    this._logger.warn(msg, cause);
  }

  error(msg: string, cause?: unknown): void;
  error(strings: TemplateStringsArray, ...args: unknown[]): void;
  error(msg: TemplateStringsArray | string, ...args: unknown[]): void {
    let cause = undefined;

    if (typeof msg !== 'string') {
      msg = $log(msg, ...args);
    } else {
      cause = args[0];
    }

    this._logger.error(msg, cause);
  }

  child(options: Record<string, unknown>): Logger {
    return new Logger(this._logger.child(options));
  }

  add(transport: winston.transport) {
    this._logger.add(transport);
  }

  remove(transport: winston.transport) {
    this._logger.remove(transport);
  }

  // Properties
  get level() {
    return this._logger.level;
  }

  set level(level: string) {
    this._logger.level = level;
  }

  get transports() {
    return this._logger.transports;
  }
}

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

    if (wt.isMainThread) {
      logger.add(
        new winston.transports.Console({
          format: consoleFormat
        })
      );

      const channel = new wt.BroadcastChannel('jujulego:jill:logger');
      channel.onmessage = (entry) => logger.log((entry as MessageEvent<LogEntry>).data);
      channel.unref();
    } else {
      logger.add(new ThreadTransport('jujulego:jill:logger'));
    }

    return new Logger(logger);
  })
  .inSingletonScope();
