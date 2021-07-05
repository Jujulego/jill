import path from 'path';
import { CommandBuilder } from 'yargs';

import { logger } from '../logger';
import { CliList } from '../utils/cli-list';
import { commandHandler } from '../wrapper';

// Types
export interface ListArgs {
  long: boolean;
}

// Command
export const command = 'list';
export const aliases = ['ls'];
export const describe = 'List workspaces';

export const builder: CommandBuilder = {
  long: {
    alias: 'l',
    type: 'boolean',
    default: false
  }
};

export const handler = commandHandler<ListArgs>(async (prj, argv) => {
  // Get data
  logger.spin('Loading project');
  const list = new CliList();

  for await (const wks of prj.workspaces()) {
    if (argv.long) {
      list.add([wks.name, wks.manifest.version || '', path.relative(process.cwd(), wks.cwd) || '.']);
    } else {
      list.add([wks.name]);
    }
  }

  logger.stop();

  // Print data
  for (const d of list.lines()) {
    console.log(d);
  }

  process.exit(0);
});
