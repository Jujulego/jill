import { logger } from '@jujulego/jill-core';
import yargs from 'yargs';

import { transport } from './logger';

// Export
export type Awaitable<T> = T | PromiseLike<T>;
export type Arguments<A> = yargs.Arguments<A> & { '--': readonly (string | number)[] };
export type Builder<T, A = T> = (yargs: yargs.Argv<T>) => yargs.Argv<A>;

// Command
export abstract class Command<A = unknown> {
  // Attributes
  readonly logger = logger;
  readonly spinner = transport.spinner;

  // Methods
  protected abstract define<T, U>(builder: Builder<T, U>): Builder<T, U & A>;
  protected abstract run(args: Arguments<A>): Awaitable<number | void>;

  setup<T>(yargs: yargs.Argv<T>): yargs.Argv<T> {
    yargs.command<A>(
      this.name,
      this.description,
      (y) => this.define(_ => _)(y),
      (a) => this._wrapper(a as Arguments<A>)
    );

    return yargs;
  }

  private async _wrapper(args: Arguments<A>): Promise<void> {
    try {
      const exit = await this.run(args);
      process.exit(exit ?? 0);
    } catch (err) {
      this.spinner.fail(err.message);
      process.exit(1);
    }
  }

  log(msg: string): void {
    if (this.spinner.isSpinning) {
      this.spinner.clear();
    }

    console.log(msg);
  }

  // Properties
  abstract get name(): string | readonly string[];
  abstract get description(): string;
}