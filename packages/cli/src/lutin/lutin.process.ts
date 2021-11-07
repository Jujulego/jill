import { logger } from '@jujulego/jill-core';
import { LutinServer } from '@jujulego/jill-lutin';
import winston, { format } from 'winston';

// Setup logger
const trans = new winston.transports.Console({
  level: 'debug',
  format: format.combine(
    format.timestamp({ format: () => new Date().toLocaleString() }),
    format.errors(),
    format.json()
  )
});
logger.add(trans);

// Start server when parent is ready
process.once('message', async () => {
  try {
    // Start server
    const server = new LutinServer();
    await server.start();

    logger.remove(trans);
    process.send?.('started');
  } catch (error) {
    process.send?.({ name: error.name, message: error.message });
    process.exit(1);
  }
});