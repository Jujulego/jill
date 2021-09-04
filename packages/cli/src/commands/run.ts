import { TaskManager } from '@jujulego/jill-core';

import { CommandHandler } from '../wrapper';
import { logger } from '../logger';
import { TaskLogger } from '../task-logger';

// Types
export interface RunArgs {
  script: string;
  workspace: string | undefined;
  '--'?: (string | number)[] | undefined;
}

// Command
export const runCommand: CommandHandler<RunArgs> = async (prj, argv) => {
  // Get workspace
  logger.spin('Loading project');
  const wks = await (argv.workspace ? prj.workspace(argv.workspace) : prj.currentWorkspace());

  if (!wks) {
    logger.fail(`Workspace ${argv.workspace || '.'} not found`);
    return 1;
  }

  // Run build task
  const task = await wks.run(argv.script, argv['--']?.map(arg => arg.toString()));
  TaskManager.global.add(task);

  const tlogger = new TaskLogger();
  tlogger.on('spin-simple', (tsk) => tsk === task ? `Running ${argv.script} in ${wks.name} ...` : `Building ${tsk.context.workspace?.name} ...`);
  tlogger.on('fail', (tsk) => tsk === task ? `${argv.script} failed` : `Failed to build ${tsk.context.workspace?.name}`);
  tlogger.on('succeed', (tsk) => tsk === task ? `${wks.name} ${argv.script} done` : `${tsk.context.workspace?.name} built`);
  tlogger.connect(TaskManager.global);

  await TaskManager.global.waitFor('finished');
  return 0;
};
