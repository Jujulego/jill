import { useStderr } from 'ink';
import { FC, useLayoutEffect, } from 'react';
import Transport from 'winston-transport';

import { consoleFormat, container, Logger } from '../services';

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
    const olds = logger.transports;

    logger.clear();
    logger.add(new class extends Transport {
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
    });

    return () => {
      logger.clear();

      for (const transport of olds) {
        logger.add(transport);
      }
    };
  }, [write]);

  return null;
};
