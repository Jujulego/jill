import { flow$ } from '@jujulego/aegis';
import { streamFormat, toStderr } from '@jujulego/logger';
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
    gateway.clear();

    // Add custom transport
    const format = streamFormat();
    const off = gateway.subscribe((log) => {
      write(format(log) + '\n');
    });

    return () => {
      off();
      flow$(gateway, toStderr());
    };
  }, [write]);

  return null;
}
