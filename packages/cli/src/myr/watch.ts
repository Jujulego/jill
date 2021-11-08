import { combine, Workspace } from '@jujulego/jill-core';

import { logger } from '../logger';
import { MyrClient } from './myr-client';
import { CommandHandler } from '../wrapper';

// Types
export interface WatchArgs {
  script: string;
  workspace: string | undefined;
  daemon: boolean;
  '--'?: (string | number)[] | undefined;
}

// Utils
async function spawnDepsTree(myr: MyrClient, wks: Workspace, set: Set<string>): Promise<number> {
  let count = 0;

  for await (const ws of combine(wks.dependencies(), wks.devDependencies())) {
    if (set.has(ws.cwd)) continue;

    // Spawn task
    const tsk = await myr.spawnScript(ws, 'watch');
    logger.log('info', `Task ${tsk.id} spawned`, { label: ws.name });

    count++;
    set.add(ws.cwd);

    // Spawn dependencies
    count += await spawnDepsTree(myr, ws, set);
  }

  return count;
}

// Command
export const watchCommand: CommandHandler<WatchArgs> = async (prj, argv) => {
  // Get workspace
  logger.spin('Loading project');
  const wks = await (argv.workspace ? prj.workspace(argv.workspace) : prj.currentWorkspace());

  if (!wks) {
    logger.fail(`Workspace ${argv.workspace || '.'} not found`);
    return 1;
  }

  // Spawn watch
  logger.spin('Connecting to myr');
  const myr = new MyrClient(prj);
  const count = await spawnDepsTree(myr, wks, new Set());

  // Spawn task
  if (argv.daemon) {
    const tsk = await myr.spawnScript(wks, argv.script, argv['--']?.map(arg => arg.toString()));
    logger.log('info', `Task ${tsk.id} spawned`, { label: wks.name });
    logger.succeed(`${count + 1} watch tasks spawned`);
  } else {
    logger.succeed(`${count} watch tasks spawned`);

    const tsk = await wks.run(argv.script, argv['--']?.map(arg => arg.toString()), { buildDeps: 'none' });
    tsk.start();

    await tsk.waitFor('done', 'failed');
    return tsk.exitCode === 0 ? 0 : 1;
  }
};