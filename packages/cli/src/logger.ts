import { logger } from '@jujulego/jill-core';
import { format, transports } from 'winston';

// Setup
logger.level = 'debug';

logger.add(new transports.Console({
  format: format.combine(
    format.colorize({ message: true, colors: { debug: 'grey', verbose: 'blue', info: 'white', error: 'red' } }),
    format.printf(({ label, message }) => [label && `[${label}]`, message].filter(p => p).join(' ')),
  )
}));

export { logger };
