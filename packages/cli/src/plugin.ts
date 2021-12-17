import { Command, CommandType } from './command';
import yargs from 'yargs';

// Class
export abstract class Plugin {
  // Attributes
  private _commands: Command[] = [];

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
      init(parser: yargs.Argv): Command[] {
        return commands.map(Cmd => new Cmd(parser));
      }
    };
  }

  // Methods
  abstract init(parser: yargs.Argv): Command[];

  setup(parser: yargs.Argv) {
    this._commands = this.init(parser);
  }

  async run(): Promise<number | void> {
    return Promise.race(this._commands.map(cmd => cmd.setup()));
  }

  // Properties
  get commands(): Command[] {
    return this._commands;
  }
}