import { Arguments, Command, Exit } from '../src/command';

// Types
export type TestArgs<A> = A & Partial<Arguments<A>>;

// Class
export class TestBed<A, C extends Command<A>> {
  // Attributes
  private _screen = '';

  // Constructor
  constructor(readonly command: C) {}

  // Methods
  async run(args: TestArgs<A>): Promise<number | void> {
    // Setup mocks & spies
    jest.spyOn(this.command.spinner, 'start').mockImplementation();
    jest.spyOn(this.command.spinner, 'stop').mockImplementation();
    jest.spyOn(this.command.spinner, 'succeed').mockImplementation();
    jest.spyOn(this.command.spinner, 'fail').mockImplementation();

    jest.spyOn(this.command.logger, 'debug');
    jest.spyOn(this.command.logger, 'verbose');
    jest.spyOn(this.command.logger, 'info');
    jest.spyOn(this.command.logger, 'warn');
    jest.spyOn(this.command.logger, 'error');

    jest.spyOn(this.command as Command<A>, 'log').mockImplementation((message) => this._screen += message + '\n');
    jest.spyOn(console, 'log').mockImplementation((message) => this._screen += message + '\n');

    // Run
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (this.command as any).run({ $0: 'jill', _: [], '--': [], ...args });
    } catch (err) {
      if (err instanceof Exit) {
        return err.code;
      }

      throw err;
    }
  }

  // Properties
  get screen() {
    return this._screen;
  }

  get spinner() {
    return this.command.spinner;
  }

  get logger() {
    return this.command.logger;
  }
}