import { logger } from '../../logger';
import { MyrClient } from '../myr-client';
import { CommandHandler } from '../../wrapper';

// Command
export const stopCommand: CommandHandler = async (prj, argv) => {
  // Spawn task
  logger.spin('Connecting to myr');
  const client = new MyrClient(prj);

  logger.spin('Stopping myr');
  const ok = await client.stop();

  if (ok) {
    logger.succeed('myr stopped');
  } else {
    logger.stop();
    logger.warn('myr was not running');
  }

  return 0;
};