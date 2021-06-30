import { Task, TaskManager } from '@jujulego/jill-core';

import { commandHandler, CommonArgs } from '../wrapper';
import { logger } from '../logger';
import { TaskLogger } from '../task-logger';

// Types
export interface BuildArgs extends CommonArgs {
  workspace: string;
}

// Command
export const command = 'build <workspace>';
export const aliases = [];
export const describe = 'Build workspace';

export const handler = commandHandler<BuildArgs>(async (prj, argv) => {
  // Get workspace
  logger.spin('Loading project');
  const wks = await prj.workspace(argv.workspace);

  if (!wks) {
    logger.fail(`Workspace ${argv.workspace} not found`);
    process.exit(1);

    return;
  }

  // Run build task
  const manager = new TaskManager();
  manager.add(await wks.build());

  const tlogger = new TaskLogger();
  tlogger.connect(manager);

  manager.start();
});
