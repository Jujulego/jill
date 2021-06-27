import { Task, TaskManager } from '@jujulego/jill-core';

import { commandHandler, CommonArgs } from '../wrapper';
import { logger } from '../logger';

// Types
export interface RunArgs extends CommonArgs {
  workspace: string;
  script: string;
}

// Command
export const command = 'run <workspace> <script>';
export const aliases = [];
export const describe = 'Run command inside workspace';

export const handler = commandHandler<RunArgs>(async (prj, argv) => {
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
  const task = await wks.run(argv.script);
  manager.add(task);

  const running = new Set<Task>();
  manager.on('started', (tsk) => {
    running.add(tsk);

    if (running.size > 1) {
      logger.spin(`Building ${running.size} packages ...`);
    } else if (tsk === task) {
      logger.spin(`Running ${argv.script} in ${argv.workspace} ...`);
    } else if (running.size > 0) {
      logger.spin(`Building ${tsk.workspace?.name || tsk.cwd} ...`);
    }
  });

  manager.on('completed', (tsk) => {
    running.delete(tsk);

    if (tsk.status === 'failed') {
      if (tsk === task) {
        logger.fail(`${argv.script} failed`);
      } else {
        logger.fail(`Failed to build ${tsk.workspace?.name || tsk.cwd}`);
      }
    } else {
      if (tsk === task) {
        logger.stop();
      } else {
        logger.succeed(`${tsk.workspace?.name || tsk.cwd} built`);
      }
    }

    if (running.size > 1) {
      logger.spin(`Building ${running.size} packages ...`);
    } else if (running.size > 0) {
      if (tsk !== task) {
        logger.spin(`Running ${argv.script} in ${argv.workspace} ...`);
      } else {
        logger.spin(`Building ${tsk.workspace?.name || tsk.cwd} ...`);
      }
    }
  });

  manager.start();
});
