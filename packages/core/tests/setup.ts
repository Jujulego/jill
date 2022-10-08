import Transport from 'winston-transport';

import { logger } from '../src/logger';

// Add transport to logger
class NoopTransport extends Transport {
  // Methods
  log(): void {
    return;
  }

  logv(): void {
    return;
  }
}

logger.add(new NoopTransport());
