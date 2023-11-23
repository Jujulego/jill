import { Box } from 'ink';
import { type ReactNode } from 'react';

import { useStdoutDimensions } from '@/src/utils/hooks.ts';
import StaticLogs from './static-logs.tsx';

// Types
export interface LayoutProps {
  children?: ReactNode;
}

// Component
export default function Layout({ children }: LayoutProps) {
  const [_, termHeight] = useStdoutDimensions();

  return (
    <>
      <StaticLogs />
      <Box height={termHeight - 4} flexDirection="column" overflow="hidden">
        { children }
      </Box>
    </>
  );
}
