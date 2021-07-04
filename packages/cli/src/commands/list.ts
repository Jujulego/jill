import { Workspace } from '@jujulego/jill-core';
import chalk from 'chalk';

import { commandHandler } from '../wrapper';
import { logger } from '../logger';

// Command
export const command = 'list';
export const aliases = ['ls'];
export const describe = 'List workspaces';

export const handler = commandHandler(async (prj) => {
  // Get data
  logger.spin('Loading project');
  const workspaces: Workspace[] = [];

  for await (const wks of prj.workspaces()) {
    workspaces.push(wks);
  }

  logger.stop();

  // Print data
  for (const wks of workspaces) {
    console.log(wks.name);
  }

  process.exit(0);
});
