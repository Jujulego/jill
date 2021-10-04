import { Task, TaskManager, Workspace } from '@jujulego/jill-core';

import { AffectedFilter, Filter } from '../filters';
import { logger } from '../logger';
import { CommandHandler } from '../wrapper';
import { TaskLogger } from '../task-logger';
import { Pipeline } from '../pipeline';

// Types
export interface EachArgs {
  script: string;
  '--': (string | number)[] | undefined;

  // Filters
  private: boolean | undefined;

  // Affected
  affected: string | undefined;
  'affected-rev-fallback': string;
  'affected-rev-sort': string | undefined;
}

// Handler
export const eachCommand: CommandHandler<EachArgs> = async (prj, argv) => {
  logger.spin('Loading project');

  // Setup pipeline
  const pipeline = new Pipeline();
  pipeline.add(Filter.scripts([argv.script]));

  if (argv.private !== undefined) {
    pipeline.add(Filter.privateWorkspace(argv.private));
  }

  if (argv.affected !== undefined) {
    pipeline.add(new AffectedFilter(
      argv.affected,
      argv['affected-rev-fallback'],
      argv['affected-rev-sort']
    ));
  }

  // Filter
  const workspaces: Workspace[] = [];

  for await (const wks of pipeline.filter(prj.workspaces())) {
    workspaces.push(wks);
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

  const [result] = await TaskManager.global.waitFor('finished');
  return result.failed === 0 ? 0 : 1;
};
