import { logger as coreLogger } from '@jujulego/jill-core';
import chalk from 'chalk';
import process from 'process';
import ora from 'ora';
import { format, Logger } from 'winston';
import Transport from 'winston-transport';

// Constants
const MESSAGE = Symbol.for('message');

// Transport
export class OraTransport extends Transport {
  // Attributes
  readonly _spinner = ora();

  // Methods
  log(info: any, next: () => void): void {
    // Print message
    const msg = info[MESSAGE] as string;

    // Clear out spinner before printing logs
    if (this._spinner.isSpinning) {
      this._spinner.clear();
    }

    for (const line of msg.split('\n')) {
      process.stderr.write(line + '\n');
    }

    next();
  }

  spin(message: string): void {
    this._spinner.start(message);
  }

  succeed(log: string): void {
    this._spinner.succeed(log);
  }

  fail(log: Error | string): void {
    if (typeof log === 'string') {
      this._spinner.fail(log);
    } else {
      this._spinner.fail(log.stack || log.toString());
    }
  }

  stop(): void {
    this._spinner.stop();
  }
}

// Logger
export class OraLogger {
  // Logger
  constructor(
    private readonly logger: Logger,
    private readonly transport: OraTransport
  ) {}

  // Methods
  // - logger
  log(level: string, message: string, meta?: Record<string, unknown>): void {
    this.logger.log(level, message, meta);
  }

  debug(message: string): void {
    this.logger.debug({ message });
  }

  verbose(message: string): void {
    this.logger.verbose({ message });
  }

  info(message: string): void {
    this.logger.info({ message });
  }

  warn(message: string): void {
    this.logger.warn({ message });
  }

  error(message: string): void {
    this.logger.error({ message });
  }

  child(options: Record<string, unknown>): Logger {
    return this.logger.child(options);
  }

  // - ora
  spin(msg: string): void {
    this.transport.spin(msg);
  }

  succeed(msg: string): void {
    this.transport.succeed(msg);
  }

  fail(msg: string): void {
    this.transport.fail(msg);
  }

  stop(): void {
    this.transport.stop();
  }

  // Properties
  get level(): string {
    return this.logger.level;
  }

  set level(level: string) {
    this.logger.level = level;
  }
}

// Setup
export const transport = new OraTransport({
  format: format.combine(
    format.errors(),
    format.colorize({ message: true, colors: { debug: 'grey', verbose: 'blue', info: 'white', error: 'red' } }),
    format.printf(({ label, message }) => message.split('\n').map(line => [label && chalk.grey(`[${label}]`), line].filter(p => p).join(' ')).join('\n')),
  )
});

coreLogger.add(transport);

export const logger = new OraLogger(coreLogger, transport);
