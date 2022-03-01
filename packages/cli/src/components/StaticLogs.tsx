import { logger } from '@jujulego/jill-core';
import { Static, Text } from 'ink';
import { FC, useEffect, useState } from 'react';
import { format } from 'winston';
import Transport from 'winston-transport';

// Types
interface Log {
  label?: string;
  message: string;
}

// Components
export const StaticLogs: FC = () => {
  // State
  const [logs, setLogs] = useState<Log[]>([]);

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
      log(log: Log, next: () => void): void {
        setLogs((old) => [...old, log]);
        next();
      }
    });
  }, []);

  // Render
  return (
    <Static items={logs} style={{ height: 1 }}>
      { ({ label, message }, idx) => (
        <Text key={idx}><Text color="grey">jill: { label && `[${label}] ` }</Text>{ message }</Text>
      ) }
    </Static>
  );
};
