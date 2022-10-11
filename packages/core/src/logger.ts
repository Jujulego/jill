import chalk from 'chalk';
import winston from 'winston';

// Setup root logger
export const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.ms(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.errors(),
        winston.format.colorize({ message: true, colors: { debug: 'grey', verbose: 'blue', info: 'white', error: 'red' } }),
        winston.format.printf(({ label, message }) => message.split('\n').map(line => [label && chalk.grey(`[${label}]`), line].filter(p => p).join(' ')).join('\n')),
      )
    })
  ]
});
