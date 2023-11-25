import { Logger } from '@jujulego/logger';
import { TaskManager } from '@jujulego/tasks';
import { type interfaces as int } from 'inversify';

import { CONFIG } from '@/src/config/config-loader.ts';
import { container } from '@/src/inversify.config.ts';

// Symbols
export const TASK_MANAGER: int.ServiceIdentifier<TaskManager> = Symbol('jujulego:jill:TaskManager');

// Service
container.bind(TASK_MANAGER)
  .toDynamicValue(({ container }) => {
    const config = container.get(CONFIG);
    const logger = container.get(Logger);

    return new TaskManager({ jobs: config.jobs, logger });
  })
  .inSingletonScope();
