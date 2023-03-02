import { TaskManager } from '@jujulego/tasks';
import { type interfaces as int } from 'inversify';

import { Logger } from '@/src/commons/logger.service.js';
import { CONFIG } from '@/src/config/config-loader.js';
import { container } from '@/src/inversify.config.js';

// Symbols
export const TASK_MANAGER: int.ServiceIdentifier<TaskManager> = Symbol('jujulego:jill:TaskManager');

// Service
container.bind(TASK_MANAGER)
  .toDynamicValue((context) => {
    const config = context.container.get(CONFIG);
    const logger = context.container.get(Logger);

    return new TaskManager({ jobs: config.jobs, logger });
  })
  .inSingletonScope();
