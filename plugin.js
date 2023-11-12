import { Command, Plugin } from '@jujulego/jill';

// Command
class TestCommand {
  handler() {
    console.log('this is a test plugin !');
  }
}

Command({
  command: 'test',
  describe: 'Plugin test command',
})(TestCommand);

// Plugin
class TestPlugin {}

Plugin({
  name: 'test',
  commands: [
    TestCommand
  ]
})(TestPlugin);

export default TestPlugin;
