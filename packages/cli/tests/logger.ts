import { logger } from '@jujulego/jill-core';
import Transport from 'winston-transport';

// Transport
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
