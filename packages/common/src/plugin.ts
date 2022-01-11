import yargs from 'yargs';

import { Command } from './command';
import { ApplicationArgs } from './application';

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
  setup(yargs: yargs.Argv<ApplicationArgs>): yargs.Argv<ApplicationArgs> {
    for (const cmd of this.commands) {
      cmd.setup(yargs);
    }

    return yargs;
  }

  // Properties
  abstract get name(): string;
  abstract get commands(): readonly Command[];
}
