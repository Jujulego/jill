import { ReactNode } from 'react';

import GlobalSpinner from './global-spinner';
import StaticLogs from './static-logs';

// Types
export interface LayoutProps {
  children?: ReactNode;
}

// Component
export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <StaticLogs />
      <GlobalSpinner />
      { children }
    </>
  );
}
