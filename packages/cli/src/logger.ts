import { logger as coreLogger } from '@jujulego/jill-core';
import chalk from 'chalk';
import process from 'process';
import ora from 'ora';
import { format } from 'winston';
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

// Setup
export const transport = new OraTransport({
  format: format.combine(
    format.errors(),
    format.colorize({ message: true, colors: { debug: 'grey', verbose: 'blue', info: 'white', error: 'red' } }),
    format.printf(({ label, message }) => message.split('\n').map(line => [label && chalk.grey(`[${label}]`), line].filter(p => p).join(' ')).join('\n')),
  )
});

coreLogger.add(transport);
