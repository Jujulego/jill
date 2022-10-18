import { useStderr } from 'ink';
import { FC, useLayoutEffect, } from 'react';
import Transport from 'winston-transport';

import { consoleFormat, container, Logger } from '../services';
import winston from 'winston';

// Constants
const MESSAGE = Symbol.for('message');

// Types
interface Info extends Record<string, unknown> {
  [MESSAGE]: string;
}

// Component
export const StaticLogs: FC = () => {
  // State
  const { write } = useStderr();

  // Effect
  useLayoutEffect(() => {
    const logger = container.get(Logger);

    // Remove Console transport
    for (const transport of logger.transports) {
      if (transport instanceof winston.transports.Console) {
        logger.remove(transport);
      }
    }

    // Add custom transport
    const transport = new class extends Transport {
      // Constructor
      constructor() {
        super({
          format: consoleFormat
        });
      }

      // Methods
      log(info: Info, next: () => void): void {
        setTimeout(() => {
          this.emit('logged', info);
        }, 0);

        write(info[MESSAGE] + '\n');

        next();
      }
    };

    logger.add(transport);

    return () => {
      logger.remove(transport);
      logger.add(new winston.transports.Console({
        format: consoleFormat
      }));
    };
  }, [write]);

  return null;
};