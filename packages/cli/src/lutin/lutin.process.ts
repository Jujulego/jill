import { logger } from '@jujulego/jill-core';
import { LutinServer } from '@jujulego/jill-lutin';
import winston, { format } from 'winston';

// Setup logger
logger.add(new winston.transports.Console({
  level: 'debug',
  format: format.combine(
    format.timestamp({ format: () => new Date().toLocaleString() }),
    format.errors(),
    format.json()
  )
}));

// Start server when parent is ready
process.once('message', async () => {
  try {
    // Start server
    const server = new LutinServer();
    await server.start();

    process.send?.('started');
  } catch (error) {
    process.send?.({ name: error.name, message: error.message });
    process.exit(1);
  }
});