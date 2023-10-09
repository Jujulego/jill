import { streamFormat } from '@jujulego/logger';
import { chalkStderr } from 'chalk';
import { useStderr } from 'ink';
import { useLayoutEffect, } from 'react';

import { container } from '@/src/inversify.config.ts';
import { LogGateway } from '@/src/commons/logger/log.gateway.ts';

// Component
export default function StaticLogs() {
  // State
  const { write } = useStderr();

  // Effect
  useLayoutEffect(() => {
    const gateway = container.get(LogGateway);

    // Remove Console transport
    const listeners = gateway.listeners;
    gateway.clear();

    // Add custom transport
    const format = streamFormat(chalkStderr);
    const off = gateway.subscribe((log) => {
      write(format(log) + '\n');
    });

    return () => {
      off();

      // Restore previous listeners
      for (const lst of listeners) {
        gateway.subscribe(lst);
      }
    };
  }, [write]);

  return null;
}
