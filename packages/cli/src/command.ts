import { logger } from '@jujulego/jill-core';
import yargs from 'yargs';

import { transport } from './logger';

// Types
export type Arguments<T = Record<string, unknown>> = yargs.Arguments<T> & { '--'?: readonly (string | number)[] };
export type CommandBuilder<T = Record<string, unknown>> = (y: yargs.Argv) => yargs.Argv<T>;

// Command
export abstract class Command {
  // Attributes
  readonly logger = logger;
  readonly spinner = transport.spinner;

  // Constructor
  constructor(
    protected readonly yargs: yargs.Argv
  ) {}

  // Methods
  abstract run(): Promise<number | void>;

  protected define<T>(command: string | readonly string[], description: string, builder?: CommandBuilder<T>): Promise<Arguments<T>> {
    return new Promise<Arguments<T>>((resolve) => {
      this.yargs.command(command, description, builder, resolve);
    });
  }

  log(msg: string): void {
    if (this.spinner.isSpinning) {
      this.spinner.clear();
    }

    console.log(msg);
  }
}