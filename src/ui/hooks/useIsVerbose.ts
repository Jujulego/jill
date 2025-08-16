import { useMemo } from 'react';
import { CONFIG } from '@/src/config/config-loader.js';
import { container } from '@/src/inversify.config.js';

/** @deprecated */
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
