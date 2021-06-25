import { logger as coreLogger } from '@jujulego/jill-core';
import { format, Logger } from 'winston';
import Transport from 'winston-transport';
import ora from 'ora';

// Constants
const MESSAGE = Symbol.for('message');

// Transport
export class OraTransport extends Transport {
  // Attributes
  private readonly _spinner = ora();

  // Methods
  keepSpinner<T>(fun: () => T): T {
    // Save state
    let spinning = false;
    let text = '';

    if (this._spinner.isSpinning) {
      spinning = true;
      text = this._spinner.text;
    }

    try {
      return fun();
    } finally {
      // Restore state
      if (!this._spinner.isSpinning && spinning) {
        this._spinner.start(text);
      }
    }
  }

  log(info: any, next?: () => void): void {
    // Print message
    const msg = info[MESSAGE] as string;

    this.keepSpinner(() => {
      this._spinner.stop();

      for (const line of msg.split('\n')) {
        process.stderr.write(line + '\n');
      }
    });

    if (next) {
      next();
    }
  }

  spin(message: string): void {
    this._spinner.start(message);
  }

  succeed(log: string): void {
    this._spinner.succeed(log);
  }

  fail(log: string): void {
    this._spinner.fail(log);
  }

  stop(): void {
    this._spinner.stop();
  }
}

// Logger
class OraLogger {
  // Logger
  constructor(
    private readonly logger: Logger,
    private readonly transport: OraTransport
  ) {}

  // Methods
  // - logger
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
    format.colorize({ message: true, colors: { debug: 'grey', verbose: 'blue', info: 'white', error: 'red' } }),
    format.printf(({ label, message }) => message.split('\n').map(line => [label && `[${label}]`, line].filter(p => p).join(' ')).join('\n')),
  )
});

coreLogger.add(transport);

export const logger = new OraLogger(coreLogger, transport);
