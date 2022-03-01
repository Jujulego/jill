import { logger } from '@jujulego/jill-core';
import { FC, useEffect, useState } from 'react';
import { format } from 'winston';
import Transport from 'winston-transport';
import { Static, Text } from 'ink';

// Types
interface Log {
  id: number;
  label?: string;
  message: string;
}

// Utils
let ID = 0;

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
        setLogs((old) => [...old, Object.assign(log, { id: ++ID })]);
        next();
      }
    });
  }, []);

  // Render
  return (
    <Static items={logs}>
      { ({ id, label, message }) => (
        <Text key={id}>
          <Text color="grey">jill: { label && `[${label}] ` }</Text>{ message }
        </Text>
      ) }
    </Static>
  );
};
