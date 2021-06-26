import winston, { format } from 'winston';

// Setup root logger
export const logger = winston.createLogger({
  format: format.combine(
    format.timestamp(),
  )
});
