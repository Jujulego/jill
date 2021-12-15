import yargs from 'yargs';

import { Command } from '../src/command';

// Types
export type Type<C> = { new(...args: any[]): C };
export type TestableCommand = Command & { run(): Promise<number | void> };
export type MockableCommand = Command & { define: Command['define'] };
export type CommandArgs<C extends MockableCommand> = jest.ResolvedValue<ReturnType<Required<C>['define']>>;

// Utils
export function TestCommand<C extends Type<TestableCommand>>(Cmd: C) {
  return class extends Cmd {
    // Redefinitions as public
    readonly yargs: Command['yargs'];
    readonly define: Command['define'];

    // Constructor
    constructor(...args: any[]) {
      super(args);
    }
  };
}

// Class
export class TestBed<C extends Type<MockableCommand>> {
  // Attributes
  private _screen = '';
  private _cmd = (new this.Command(yargs)) as InstanceType<C>;

  // Constructor
  constructor(
    readonly Command: C
  ) {}

  // Methods
  beforeEach() {
    this._cmd = (new this.Command(yargs)) as InstanceType<C>;
    this._screen = '';
  }

  async run(args: CommandArgs<InstanceType<C>>): Promise<number | void> {
    // Setup mocks & spies
    jest.spyOn(this._cmd.spinner, 'start').mockImplementation();
    jest.spyOn(this._cmd.spinner, 'stop').mockImplementation();
    jest.spyOn(this._cmd.spinner, 'succeed').mockImplementation();
    jest.spyOn(this._cmd.spinner, 'fail').mockImplementation();

    jest.spyOn(this._cmd.logger, 'debug');
    jest.spyOn(this._cmd.logger, 'verbose');
    jest.spyOn(this._cmd.logger, 'info');
    jest.spyOn(this._cmd.logger, 'warn');
    jest.spyOn(this._cmd.logger, 'error');

    jest.spyOn(this._cmd, 'define').mockResolvedValue(args);
    jest.spyOn(this._cmd as Command, 'log').mockImplementation((message) => this._screen += message + '\n');
    jest.spyOn(console, 'log').mockImplementation((message) => this._screen += message + '\n');

    // Run
    return await this._cmd.run();
  }

  // Properties
  get cmd() {
    return this._cmd;
  }

  get screen() {
    return this._screen;
  }

  get spinner() {
    return this._cmd.spinner;
  }

  get logger() {
    return this._cmd.logger;
  }
}