import { logger } from '../../logger';
import { MyrClient } from '../myr-client';
import { CommandHandler } from '../../wrapper';

// Command
export const stopCommand: CommandHandler = async (prj) => {
  // Spawn task
  logger.spin('Stopping myr');
  const client = new MyrClient(prj);
  const ok = await client.stop();

  if (ok) {
    logger.succeed('myr stopped');
  } else {
    logger.stop();
    logger.warn('myr was not running');
  }

  return 0;
};