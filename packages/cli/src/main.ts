import { Project, TaskManager } from '@jujulego/jill-core';
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

    manager.on('started', (task) => logger.info(`Building ${task.workspace?.name || task.cwd}`));

    manager.start();
  }
})();
