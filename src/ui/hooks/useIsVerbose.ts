import { useMemo } from 'react';

import { CONFIG } from '@/src/config/config-loader.ts';
import { container } from '@/src/inversify.config.ts';

export function useIsVerbose() {
  return useMemo(() => {
    const config = container.get(CONFIG);

    if (config.verbose) {
      return ['verbose', 'debug'].includes(config.verbose);
    } else {
      return false;
    }
  }, []);
}
