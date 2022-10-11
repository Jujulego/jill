import { TaskManager } from '@jujulego/tasks';
import { inject, injectable } from 'inversify';
import winston from 'winston';

import { container, type GlobalConfig, TOKENS } from './inversify.config';

export const manager = new TaskManager<any>();

// Service
@injectable()
export class TaskManagerService extends TaskManager<any> {
  // Constructor
  constructor(
    @inject(TOKENS.GlobalConfig) config: GlobalConfig,
    @inject(TOKENS.Logger) logger: winston.Logger,
  ) {
    super({ jobs: config.jobs, logger });
  }
}

// Bind
container.bind(TaskManagerService).toSelf();
