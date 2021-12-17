import { EventEmitter, logger } from '@jujulego/jill-core';
import yargs from 'yargs';

import { transport } from './logger';

// Types
export type Arguments<T = Record<string, unknown>> = yargs.Arguments<T> & { '--'?: readonly (string | number)[] };
export type CommandBuilder<T = Record<string, unknown>> = (y: yargs.Argv) => yargs.Argv<T>;

export type CommandEvent = 'defined';
export type CommandEventMap = Record<CommandEvent, []>

export type CommandType = { new (parser: yargs.Argv): Command };

// Command
export abstract class Command extends EventEmitter<CommandEventMap> {
  // Attributes
  readonly logger = logger;
  readonly spinner = transport.spinner;

  private _defined = false;

  // Constructor
  constructor(
    protected readonly yargs: yargs.Argv
  ) {
    super();
  }

  // Methods
  async setup(): Promise<number | void> {
    const res = await this.run();

    if (!this._defined) {
      throw new Error(`You must call define in run method of ${this.constructor.name} !`);
    }

    return res;
  }

  protected abstract run(): Promise<number | void>;

  protected define<T>(command: string | readonly string[], description: string, builder?: CommandBuilder<T>): Promise<Arguments<T>> {
    return new Promise<Arguments<T>>((resolve) => {
      this.yargs.command(command, description, builder, resolve);

      this._defined = true;
      this.emit('defined');
    });
  }

  log(msg: string): void {
    if (this.spinner.isSpinning) {
      this.spinner.clear();
    }

    console.log(msg);
  }
}