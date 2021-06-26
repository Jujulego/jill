import { Task, TaskManager } from '@jujulego/jill-core';

import { commandHandler, CommonArgs } from '../wrapper';
import { logger } from '../logger';

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

  const running = new Set<Task>();
  manager.on('started', (task) => {
    running.add(task);

    if (running.size > 1) {
      logger.spin(`Building ${running.size} packages ...`);
    } else {
      logger.spin(`Building ${task.workspace?.name || task.cwd} ...`);
    }
  });

  manager.on('completed', (task) => {
    running.delete(task);

    if (task.status === 'failed') {
      logger.fail(`Failed to build ${task.workspace?.name || task.cwd}`);
    } else {
      logger.succeed(`${task.workspace?.name || task.cwd} built`);
    }

    if (running.size > 1) {
      logger.spin(`Building ${running.size} packages ...`);
    } else if (running.size > 0) {
      logger.spin(`Building ${task.workspace?.name || task.cwd} ...`);
    }
  });

  manager.start();
});
