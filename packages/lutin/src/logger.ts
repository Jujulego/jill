import winston, { format, transports } from 'winston';
import chalk from 'chalk';

// Setup root logger
export const logger = winston.createLogger({
  format: format.combine(
    format.timestamp(),
  ),
  transports: [
    new transports.Console({
      level: 'debug',
      format: format.combine(
        format.timestamp({ format: () => new Date().toLocaleString() }),
        format.printf(({ context, message, timestamp }) => context
          ? chalk`[jill-lutin] {white ${timestamp}} {grey [${context}]} ${message}`
          : chalk`[jill-lutin] {white ${timestamp}} ${message}`
        ),
        format.colorize({ all: true }),
      ),
    }),
  ]
});
