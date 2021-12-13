import { Command, Options } from '../src/command';

// Types
export type Type<C> = { new(...args: any[]): C };
export type TestableCommand = Command & { run(): Promise<number | void> };

// Utils
export function TestCommand<C extends Type<TestableCommand>>(Cmd: C) {
  return class extends Cmd {
    // Attributes
    readonly yargs: Command['yargs'];
    readonly logger: Command['logger'];
    readonly spinner: Command['spinner'];

    // Constructor
    constructor(...args: any[]) {
      super(args);
    }

    // Methods
    async define<O extends Options>(command: string | ReadonlyArray<string>, description: string, options: O) {
      return super.define(command, description, options);
    }
  };
}

// Class
export class TestBed<C extends Type<TestableCommand>> {
  // Attributes

  readonly TestCommand = TestCommand<C>(this.Command);

  // Constructor
  constructor(private readonly Command: C) {}
}