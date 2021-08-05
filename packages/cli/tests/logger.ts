import { logger } from '@jujulego/jill-core';
import Transport from 'winston-transport';

import { OraTransport } from '../src/logger';

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


jest.spyOn(OraTransport.prototype, 'log')
jest.spyOn(OraTransport.prototype, 'spin')
jest.spyOn(OraTransport.prototype, 'succeed')
jest.spyOn(OraTransport.prototype, 'fail')
jest.spyOn(OraTransport.prototype, 'stop')