import { Logger, logger$, withTimestamp } from '@jujulego/logger';

import { container } from '@/src/inversify.config.ts';
import { LogGateway } from '@/src/commons/logger/log.gateway.ts';

// Service
container.bind(Logger).toDynamicValue(() => logger$(withTimestamp()))
  .inSingletonScope()
  .onActivation(({ container }, logger) => {
    const gateway = container.get(LogGateway);
    gateway.connect(logger);

    return logger;
  });
