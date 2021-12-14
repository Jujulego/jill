import { logger } from '@jujulego/jill-core';
import yargs from 'yargs';

import { transport } from './logger';

// Types
export type Arguments<T = Record<string, unknown>> = yargs.Arguments<T> & { '--'?: readonly (string | number)[] };
export type CommandBuilder<T = Record<string, unknown>> = (y: yargs.Argv) => yargs.Argv<T>;

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
  protected define<T>(command: string | readonly string[], description: string, builder: CommandBuilder<T>): Promise<Arguments<T>>;
  protected define(command: string | ReadonlyArray<string>, description: string, builder: CommandBuilder): Promise<Arguments> {
    return new Promise<Arguments>((resolve) => {
      this.yargs.command(command, description, builder, resolve);
    });
  }

  abstract run(): Promise<number | void>;
}