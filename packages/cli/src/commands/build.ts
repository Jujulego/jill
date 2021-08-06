import { TaskManager } from '@jujulego/jill-core';

import { logger } from '../logger';
import { TaskLogger } from '../task-logger';
import { CommandHandler } from '../wrapper';

// Types
export interface BuildArgs {
  workspace: string | undefined;
}

// Command
export const buildCommand: CommandHandler<BuildArgs> = async (prj, argv) => {
  // Get workspace
  logger.spin('Loading project');
  const wks = await (argv.workspace ? prj.workspace(argv.workspace) : prj.currentWorkspace());

  if (!wks) {
    logger.fail(`Workspace ${argv.workspace || '.'} not found`);
    return 1;
  }

  // Run build task
  const manager = new TaskManager();
  manager.add(await wks.build());

  const tlogger = new TaskLogger();
  tlogger.connect(manager);

  manager.start();
};