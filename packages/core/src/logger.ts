import chalk from 'chalk';
import winston from 'winston';

import { GlobalConfig, container, TOKENS } from './inversify.config';

// Constants
const VERBOSITY_LEVEL: Record<number, string> = {
  1: 'verbose',
  2: 'debug',
};

// Setup root logger
container.bind(TOKENS.Logger).toDynamicValue((context) => {
  const { verbose } = context.container.get<GlobalConfig>(TOKENS.GlobalConfig);

  return winston.createLogger({
    level: VERBOSITY_LEVEL[Math.min(verbose, 2)],
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.ms(),
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.errors(),
          winston.format.colorize({
            message: true,
            colors: { debug: 'grey', verbose: 'blue', info: 'white', error: 'red' }
          }),
          winston.format.printf(({ label, message }) => message.split('\n').map(line => [label && chalk.grey(`[${label}]`), line].filter(p => p).join(' ')).join('\n')),
        )
      })
    ]
  });
});

export const logger = winston.createLogger();
