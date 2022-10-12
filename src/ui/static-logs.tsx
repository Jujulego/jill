import { Static, Text } from 'ink';
import { FC, useLayoutEffect, useState } from 'react';
import Transport from 'winston-transport';

import { container, Logger } from '../services';

// Constants
const COLORS: Record<string, string> = {
  debug: 'grey',
  verbose: 'blue',
  warn: 'yellow',
  error: 'red',
};

// Utils
let id = 0;

// Component
export const StaticLogs: FC = () => {
  // State
  const [logs, setLogs] = useState<any[]>([]);

  // Effect
  useLayoutEffect(() => {
    const logger = container.get(Logger);
    const olds = logger.transports;

    logger.clear();
    logger.add(new class extends Transport {
      // Methods
      log(info: any, next: () => void): void {
        setTimeout(() => {
          this.emit('logged', info);
        }, 0);

        setLogs((old) => [...old, { id: ++id, ...info }]);

        next();
      }
    });

    return () => {
      logger.clear();

      for (const transport of olds) {
        logger.add(transport);
      }
    };
  }, []);

  return (
    <Static items={logs}>
      { (log) => (
        <Text key={log.id} color={COLORS[log.level]}>
          { log.label && <Text color="grey">[{ log.label }]{' '}</Text> }
          { log.message }
        </Text>
      ) }
    </Static>
  );
};
