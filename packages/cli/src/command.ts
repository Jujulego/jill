import yargs from 'yargs';

import { logger, transport } from './logger';

// Types
export type Options = Record<string, yargs.Options>;
export type Arguments<O extends Options> = yargs.Arguments<yargs.InferredOptionTypes<O>>;

// Command
export abstract class Command {
  // Attributes
  protected readonly logger = logger;
  protected readonly spinner = transport.spinner;

  // Constructor
  constructor(
    protected readonly yargs: yargs.Argv
  ) {}

  // Methods
  protected define<O extends Options>(
    command: string | ReadonlyArray<string>,
    description: string,
    options: O
  ): Promise<Arguments<O>> {
    return new Promise<Arguments<O>>((resolve) => {
      this.yargs.command<O>(command, description, options, resolve);
    });
  }

  abstract run(): Promise<number | void>;
}