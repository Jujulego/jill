import { logger as coreLogger } from '@jujulego/jill-core';
import { format } from 'winston';
import Transport from 'winston-transport';
import logSymbols from 'log-symbols';
import ora from 'ora';

// Constants
const LEVEL = Symbol.for('level');
const MESSAGE = Symbol.for('message');

const SYMBOLS: Partial<Record<string, string>> = {
  info: logSymbols.info,
  warn: logSymbols.warning,
  error: logSymbols.error
};

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
    if (next) {
      setImmediate(next);
    }

    // Print message
    const msg = info[MESSAGE] as string;
    const lvl = info[LEVEL] as string;

    this.keepSpinner(() => {
      for (const line of msg.split('\n')) {
        this._spinner.stopAndPersist({ text: line, symbol: SYMBOLS[lvl] || ' ' });
      }
    });
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

// Setup
const transport = new OraTransport({
  format: format.combine(
    format.colorize({ message: true, colors: { debug: 'grey', verbose: 'blue', info: 'white', error: 'red' } }),
    format.printf(({ label, message }) => message.split('\n').map(line => [label && `[${label}]`, line].filter(p => p).join(' ')).join('\n')),
  )
});

coreLogger.level = 'debug';
coreLogger.add(transport);

export const logger = {
  // Logger
  debug: coreLogger.debug,
  verbose: coreLogger.verbose,
  info: coreLogger.info,
  warn: coreLogger.warn,
  error: coreLogger.error,

  spin: transport.spin.bind(transport),
  succeed: transport.succeed.bind(transport),
  fail: transport.fail.bind(transport),
  stop: transport.stop.bind(transport)
};
