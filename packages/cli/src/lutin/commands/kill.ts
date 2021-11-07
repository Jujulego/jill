import { logger } from '../../logger';
import { LutinClient } from '../lutin-client';
import { CommandHandler } from '../../wrapper';

// Types
export interface KillArgs {
  id: string;
}

// Command
export const killCommand: CommandHandler<KillArgs> = async (prj, argv) => {
  // Spawn task
  logger.spin('Connecting to lutin');
  const client = new LutinClient(prj);

  logger.spin('Spawning task');
  const task = await client.kill(argv.id);

  if (task) {
    logger.succeed(`Task ${task.id} killed`);
    return 0;
  } else {
    logger.fail(`Task ${argv.id} not found`);
    return 1;
  }
};