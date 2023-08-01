import { useStderr } from 'ink';
import { useLayoutEffect, } from 'react';
import winston from 'winston';
import Transport from 'winston-transport';

import { container } from '@/src/inversify.config.ts';
import { Logger } from '@/src/commons/logger.service.ts';
import { consoleFormat } from '@/src/commons/logger/console.formatter.ts';

// Constants
const MESSAGE = Symbol.for('message');

// Types
interface Info extends Record<string, unknown> {
  [MESSAGE]: string;
}

// Component
export default function StaticLogs() {
  // State
  const { write } = useStderr();

  // Effect
  useLayoutEffect(() => {
    const logger = container.get(Logger);

    // Remove Console transport
    for (const transport of logger.winston.transports) {
      if (transport instanceof winston.transports.Console) {
        logger.winston.remove(transport);
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

    logger.winston.add(transport);

    return () => {
      logger.winston.remove(transport);
      logger.winston.add(new winston.transports.Console({
        format: consoleFormat
      }));
    };
  }, [write]);

  return null;
}
