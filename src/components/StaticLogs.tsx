import { inject$ } from '@kyrielle/injector';
import { LogGateway, type WithDelay } from '@kyrielle/logger';
import { useStderr } from 'ink';
import { observer$ } from 'kyrielle';
import { useLayoutEffect } from 'react';
import { logFormat } from '../utils/logger.js';

// Component
export function StaticLogs() {
  const stderr = useStderr();

  useLayoutEffect(() => {
    const gateway: LogGateway<WithDelay> = inject$(LogGateway);
    const toConsole = gateway.disconnect('console')!;

    gateway.connect('ink', observer$({
      next: (log) => stderr.write(logFormat(log) + '\n')
    }));

    return () => {
      gateway.disconnect('ink');
      gateway.connect('console', toConsole);
    };
  }, [stderr]);

  return null;
}

