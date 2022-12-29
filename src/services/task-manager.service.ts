import { TaskManager } from '@jujulego/tasks';

import { type ServicesConfig, SERVICES_CONFIG, container } from './inversify.config';
import { Logger } from './logger.service';

// Service
container.bind(TaskManager)
  .toDynamicValue((context) => {
    const config = context.container.get<ServicesConfig>(SERVICES_CONFIG);
    const logger = context.container.get(Logger);

    return new TaskManager({ jobs: config.jobs, logger });
  })
  .inSingletonScope();
