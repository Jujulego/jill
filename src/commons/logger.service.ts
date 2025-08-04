import { Logger, logger$, withTimestamp } from '@jujulego/logger';

import { container } from '@/src/inversify.config.js';
import { LogGateway } from '@/src/commons/logger/log.gateway.js';

// Service
container.bind(Logger).toDynamicValue(() => logger$(withTimestamp()))
  .inSingletonScope()
  .onActivation(({ container }, logger) => {
    const gateway = container.get(LogGateway);
    gateway.connect(logger);

    return logger;
  });
