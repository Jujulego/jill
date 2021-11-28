import { logger } from '@jujulego/jill-core';
import { MyrServer } from '@jujulego/jill-myr';
import winston, { format } from 'winston';

// Setup logger
const trans = new winston.transports.Console({
  level: 'debug',
  format: format.combine(
    format.timestamp({ format: () => new Date().toLocaleString() }),
    format.errors(),
    format.json()
  ),
  consoleWarnLevels: [],
  stderrLevels: []
});
logger.add(trans);

// Start server when parent is ready
process.once('message', async () => {
  try {
    // Start server
    const server = await MyrServer.createServer();
    await server.start();

    logger.remove(trans);
    process.send?.('started');
  } catch (error) {
    process.send?.({ name: error.name, message: error.message });
    process.exit(1);
  }
});