import { Project, Task, TaskManager } from '@jujulego/jill-core';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';

import { logger } from './logger';

// Bootstrap
(async () => {
  // Options
  const argv = await yargs(hideBin(process.argv))
    .option('project', {
      alias: 'p',
      type: 'string',
      description: 'Project root directory',
      default: '.'
    })
    .argv;

  // Run !
  const prj = new Project(argv.project);
  const wks = await prj.workspace('mock-test-a');

  if (wks) {
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
  }
})();
