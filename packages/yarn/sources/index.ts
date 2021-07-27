import { CommandContext, Plugin } from '@yarnpkg/core';
import { Command } from 'clipanion';

class HelloWorldCommand extends Command<CommandContext> {
  @Command.String('--name')
  name = 'John Doe';

  @Command.Path('hello', 'world')
  async execute(): Promise<void> {
    console.log(`Hello ${this.name}!`);
  }
}

const plugin: Plugin = {
  hooks: {
    afterAllInstalled: () => {
      console.log('What a great install, am I right?');
    },
  },
  commands: [
    HelloWorldCommand,
  ],
};

export default plugin;
