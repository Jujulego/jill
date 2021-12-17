import { Command, CommandType } from './command';
import yargs from 'yargs';

// Class
export abstract class Plugin {
  // Attributes
  readonly commands: readonly Command[] = [];

  // Constructor
  protected constructor(
    readonly name: string
  ) {}

  // Statics
  static createPlugin(name: string, commands: CommandType[]): Plugin {
    return new class extends Plugin {
      // Constructor
      constructor() {
        super(name);
      }

      // Methods
      setup(parser: yargs.Argv): Command[] {
        return commands.map(Cmd => new Cmd(parser));
      }
    };
  }

  // Methods
  abstract setup(parser: yargs.Argv): Command[];

  async run(): Promise<number | void> {
    return Promise.race(this.commands.map(cmd => cmd.setup()));
  }
}