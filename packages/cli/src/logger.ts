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
  readonly spinner = ora();

  // Methods
  log(info: any, next: () => void): void {
    // Print message
    const msg = info[MESSAGE] as string;

    // Clear out spinner before printing logs
    if (this.spinner.isSpinning) {
      this.spinner.clear();
    }

    for (const line of msg.split('\n')) {
      process.stderr.write(line + '\n');
    }

    next();
  }

  /** @deprecated */
  spin(message: string): void {
    this.spinner.start(message);
  }

  /** @deprecated */
  succeed(log: string): void {
    this.spinner.succeed(log);
  }

  /** @deprecated */
  fail(log: Error | string): void {
    if (typeof log === 'string') {
      this.spinner.fail(log);
    } else {
      this.spinner.fail(log.stack || log.toString());
    }
  }

  /** @deprecated */
  stop(): void {
    this.spinner.stop();
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
  /** @deprecated */
  spin(msg: string): void {
    this.transport.spin(msg);
  }

  /** @deprecated */
  succeed(msg: string): void {
    this.transport.succeed(msg);
  }

  /** @deprecated */
  fail(msg: string): void {
    this.transport.fail(msg);
  }

  /** @deprecated */
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

/** @deprecated */
export const logger = new OraLogger(coreLogger, transport);
