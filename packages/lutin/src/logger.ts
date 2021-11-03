import { logger } from '@jujulego/jill-core';
import { format, transports } from 'winston';
import chalk from 'chalk';

// Setup root logger
logger.add(
  new transports.Console({
    level: 'debug',
    format: format.combine(
      format.timestamp({ format: () => new Date().toLocaleString() }),
      { transform: (info) => Object.assign(info, { context: info.task?.substr(0, 8) || info.context }) },
      format.printf(({ context, message, timestamp }) => context
        ? chalk`[jill-lutin] {white ${timestamp}} {grey [${context}]} ${message}`
        : chalk`[jill-lutin] {white ${timestamp}} ${message}`
      ),
      format.colorize({ all: true }),
    ),
  })
);

export { logger };
