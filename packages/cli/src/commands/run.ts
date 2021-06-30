import { TaskManager } from '@jujulego/jill-core';

import { commandHandler, CommonArgs } from '../wrapper';
import { logger } from '../logger';
import { TaskLogger } from '../task-logger';

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
  const task = await wks.run(argv.script, argv['--']?.map(arg => arg.toString()));
  manager.add(task);

  const tlogger = new TaskLogger();
  tlogger.on('spin-simple', (tsk) => tsk === task ? `Running ${argv.script} in ${argv.workspace} ...` : `Building ${tsk.workspace?.name || tsk.cwd} ...`);
  tlogger.on('fail', (tsk) => tsk === task ? `${argv.script} failed` : `Failed to build ${tsk.workspace?.name || tsk.cwd}`);
  tlogger.on('succeed', (tsk) => tsk === task ? `${argv.workspace} ${argv.script} done` : `${tsk.workspace?.name || tsk.cwd} built`);
  tlogger.connect(manager);

  manager.start();
});
