// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Command, Plugin } = require('./dist');

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

module.exports = { default: TestPlugin };
