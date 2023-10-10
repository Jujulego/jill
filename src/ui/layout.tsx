import { type ReactNode } from 'react';

import StaticLogs from './static-logs.tsx';

// Types
export interface LayoutProps {
  children?: ReactNode;
}

// Component
export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <StaticLogs />
      { children }
    </>
  );
}
