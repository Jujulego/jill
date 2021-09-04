import { Task, TaskManager, Workspace } from '@jujulego/jill-core';

import { logger } from '../logger';
import { CommandHandler } from '../wrapper';
import { TaskLogger } from '../task-logger';

// Types
export interface EachArgs {
  script: string;
  '--'?: (string | number)[] | undefined;

  // Filters
  affected: string | undefined;
  private: boolean | undefined;
}

// Handler
export const eachCommand: CommandHandler<EachArgs> = async (prj, argv) => {
  // Get data
  logger.spin('Loading project');
  const workspaces: Workspace[] = [];

  for await (const wks of prj.workspaces()) {
    // Filter
    if (argv.private !== undefined) {
      if ((wks.manifest.private ?? false) !== argv.private) continue;
    }

    if (argv.affected !== undefined) {
      if (!await wks.isAffected(argv.affected)) continue;
    }

    if (argv.script in (wks.manifest.scripts || {})) {
      workspaces.push(wks);
    } else {
      logger.warn(`Workspace ${wks.name} ignored as it doesn't have the ${argv.script} script`);
    }
  }

  logger.stop();

  if (workspaces.length === 0) {
    logger.fail('No workspace found !');

    return 1;
  }

  logger.verbose(`Will run ${argv.script} in ${workspaces.map(wks => wks.name).join(', ')}`);

  // Run tasks
  const tasks: Task[] = [];

  for (const wks of workspaces) {
    const task = await wks.run(argv.script, argv['--']?.map(arg => arg.toString()));

    tasks.push(task);
    TaskManager.global.add(task);
  }

  const tlogger = new TaskLogger();
  tlogger.on('spin-multiple', (count) => `Working in ${count} packages ...`);
  tlogger.on('spin-simple', (tsk) => tasks.includes(tsk) ? `Running ${argv.script} in ${tsk.context.workspace?.name} ...` : `Building ${tsk.context.workspace?.name} ...`);
  tlogger.on('fail', (tsk) => tasks.includes(tsk) ? `${tsk.context.workspace?.name} ${argv.script} failed` : `Failed to build ${tsk.context.workspace?.name}`);
  tlogger.on('succeed', (tsk) => tasks.includes(tsk) ? `${tsk.context.workspace?.name} ${argv.script} done` : `${tsk.context.workspace?.name} built`);
  tlogger.connect(TaskManager.global);

  await TaskManager.global.waitFor('finished');
  return 0;
};
