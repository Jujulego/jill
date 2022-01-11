import { Builder, Command } from './command';

// Class
export abstract class SuperCommand extends Command {
  // Properties
  abstract get commands(): readonly Command[];

  // Methods
  protected define<U>(builder: Builder<U>): Builder<U> {
    return (yargs) => {
      const res = builder(yargs);

      for (const cmd of this.commands) {
        cmd.setup(res);
      }

      return res;
    };
  }

  protected run(): number {
    return 0;
  }
}
