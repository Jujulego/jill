import { logger } from '../../logger';
import { LutinClient } from '../lutin-client';
import { CommandHandler } from '../../wrapper';

// Types
export interface SpawnArgs {
  command: string;
  workspace: string | undefined;
  '--'?: (string | number)[] | undefined;
}

// Command
export const spawnCommand: CommandHandler<SpawnArgs> = async (prj, argv) => {
  // Get workspace
  logger.spin('Loading project');
  const wks = await (argv.workspace ? prj.workspace(argv.workspace) : prj.currentWorkspace());

  if (!wks) {
    logger.fail(`Workspace ${argv.workspace || '.'} not found`);
    return 1;
  }

  // Spawn task
  logger.spin('Connecting to lutin');
  const client = new LutinClient();

  logger.spin('Spawning task');
  const task = await client.spawn(wks.cwd, argv.command, argv['--']?.map(arg => arg.toString()));

  logger.succeed(`Task ${task.id} spawned`);
  return 0;
};