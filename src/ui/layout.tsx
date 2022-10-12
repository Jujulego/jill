import { FC } from 'react';

import { GlobalSpinner } from './global-spinner';
import { StaticLogs } from './static-logs';

// Component
export const Layout: FC = () => (
  <>
    <StaticLogs />
    <GlobalSpinner />
  </>
);
