import { TaskManager } from '@jujulego/tasks';
import { interfaces as int } from 'inversify';

import { type ServicesConfig, SERVICES_CONFIG, container } from '../inversify.config';
import { Logger } from '../logger.service';

// Symbols
export const TASK_MANAGER: int.ServiceIdentifier<TaskManager> = Symbol('jujulego:jill:TaskManager');

// Service
container.bind(TASK_MANAGER)
  .toDynamicValue((context) => {
    const config = context.container.get<ServicesConfig>(SERVICES_CONFIG);
    const logger = context.container.get(Logger);

    return new TaskManager({ jobs: config.jobs, logger });
  })
  .inSingletonScope();
