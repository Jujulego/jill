import { logger } from '@jujulego/jill-core';
import { Arguments, Argv } from 'yargs';

import { transport } from './logger';

// Export
export type Builder<T, A = T> = (yargs: Argv<T>) => Argv<A>

// Command
export abstract class Command<A> {
  // Attributes
  readonly logger = logger;
  readonly spinner = transport.spinner;

  // Methods
  protected abstract define<T, U>(builder: Builder<T, U>): Builder<T, U & A>;
  protected abstract run(args: Arguments<A>): void | Promise<void>;

  setup(yargs: Argv) {
    return yargs.command(
      this.name,
      this.description,
      (y) => this.define(y => y)(y),
      (a) => this.run(a)
    );
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