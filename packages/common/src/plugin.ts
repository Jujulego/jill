import yargs from 'yargs';

import { Command } from './command';

// Types
export type CommandType = { new(): Command };

// Class
export abstract class Plugin {
  // Statics
  static createPlugin(name: string, commands: CommandType[]): Plugin {
    return new class extends Plugin {
      readonly name = name;
      readonly commands = commands.map(Cmd => new Cmd());
    };
  }

  // Methods
  setup<T>(yargs: yargs.Argv<T>): yargs.Argv<T> {
    for (const cmd of this.commands) {
      cmd.setup(yargs);
    }

    return yargs;
  }

  // Properties
  abstract get name(): string;
  abstract get commands(): readonly Command[];
}