import { logger } from '@jujulego/jill-core';
import yargs from 'yargs';

import { transport } from './logger';
import { ApplicationArgs } from './application';

// Export
export type Awaitable<T> = T | PromiseLike<T>;
export type Arguments<A> = yargs.Arguments<A & ApplicationArgs> & { '--': readonly (string | number)[] };
export type Builder<A = ApplicationArgs> = (yargs: yargs.Argv<ApplicationArgs>) => yargs.Argv<A & ApplicationArgs>;

// Exceptions
export class Exit extends Error {
  // Constructor
  constructor(readonly code = 1) {
    super();
  }
}

// Command
export abstract class Command<A extends ApplicationArgs = ApplicationArgs> {
  // Attributes
  readonly logger = logger;
  readonly spinner = transport.spinner;

  // Methods
  protected abstract define<U>(builder: Builder<U>): Builder<U & A>;
  protected abstract run(args: Arguments<A>): Awaitable<number | void>;

  setup(yargs: yargs.Argv<ApplicationArgs>): yargs.Argv<ApplicationArgs> {
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
      if (err instanceof Exit) {
        process.exit(err.code);
      }

      this.spinner.fail(err.message);
      process.exit(1);
    }
  }

  log(msg: string): void {
    if (this.spinner.isSpinning) {
      this.spinner.clear();
    }

    process.stdout.write(msg + '\n');
  }

  // Properties
  abstract get name(): string | readonly string[];
  abstract get description(): string;
}
