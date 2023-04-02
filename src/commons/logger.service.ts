import { type ILogger } from '@jujulego/tasks';
import { injectable } from 'inversify';
import winston, { type LogEntry } from 'winston';
import wt from 'node:worker_threads';

import { container } from '@/src/inversify.config';

import { $log } from './logger/log.tag';
import { consoleFormat } from './logger/console.formatter';
import { ThreadTransport } from './logger/thread.transport';

// Service
@injectable()
export class Logger implements ILogger {
  // Constructor
  constructor(
    readonly winston: winston.Logger
  ) {}

  // Methods
  log(level: string, msg: string): void {
    this.winston.log(level, msg);
  }

  debug(msg: string): void;
  debug(strings: TemplateStringsArray, ...args: unknown[]): void;
  debug(msg: TemplateStringsArray | string, ...args: unknown[]): void {
    if (typeof msg !== 'string') {
      msg = $log(msg, ...args);
    }

    this.winston.debug(msg);
  }

  verbose(msg: string): void;
  verbose(strings: TemplateStringsArray, ...args: unknown[]): void;
  verbose(msg: TemplateStringsArray | string, ...args: unknown[]): void {
    if (typeof msg !== 'string') {
      msg = $log(msg, ...args);
    }

    this.winston.verbose(msg);
  }

  info(msg: string): void;
  info(strings: TemplateStringsArray, ...args: unknown[]): void;
  info(msg: TemplateStringsArray | string, ...args: unknown[]): void {
    if (typeof msg !== 'string') {
      msg = $log(msg, ...args);
    }

    this.winston.info(msg);
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

    this.winston.warn(msg, cause);
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

    this.winston.error(msg, cause);
  }

  child(options: Record<string, unknown>): Logger {
    return new Logger(this.winston.child(options));
  }

  // Properties
  get level() {
    return this.winston.level;
  }

  set level(level: string) {
    this.winston.level = level;
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
