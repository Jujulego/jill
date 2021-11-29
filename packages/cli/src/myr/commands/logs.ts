import { logger } from '../../logger';
import { MyrClient } from '../myr-client';
import { CommandHandler } from '../../wrapper';

// Command
export const logsCommand: CommandHandler = async (prj, argv) => {
  // Spawn task
  logger.spin('Connecting to myr');
  const client = new MyrClient(prj);

  logger.spin('Requesting logs');
  const logs = await client.logs();
  logger.stop();

  for (const log of logs) {
    console.log(JSON.stringify(log));
  }

  return 0;
};