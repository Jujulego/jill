import { logger } from '@jujulego/jill-core';
import { FC, useEffect, useState } from 'react';
import { format } from 'winston';
import Transport from 'winston-transport';
import { Static, Text } from 'ink';

// Components
export const StaticLogs: FC = () => {
  // State
  const [logs, setLogs] = useState<any[]>([]);

  // Effects
  useEffect(() => {
    logger.add(new class extends Transport {
      // Constructor
      constructor() {
        super({
          format: format.combine(
            format.errors(),
            format.colorize({ message: true, colors: { debug: 'grey', verbose: 'blue', info: 'white', error: 'red' } }),
          )
        });
      }

      // Methods
      log(log: any, next: () => void): void {
        setLogs((old) => [...old, log]);
        next();
      }
    });
  }, []);

  // Render
  return (
    <Static items={logs}>
      { ({ label, message }, idx) => (
        <Text key={idx}>
          <Text color="grey">jill: { label && `[${label}] ` }</Text>
          { message }
        </Text>
      ) }
    </Static>
  );
};
