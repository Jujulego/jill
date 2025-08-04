import type { CommandModule } from 'yargs';

// Command
const command: CommandModule = {
  command: 'list',
  aliases: ['ls'],
  describe: 'List project workspaces',
  async handler() {
    console.log('list !');
  }
};

export default command;
