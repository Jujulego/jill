import { type ReactNode } from 'react';

import GlobalSpinner from './global-spinner.jsx';
import StaticLogs from './static-logs.jsx';

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
