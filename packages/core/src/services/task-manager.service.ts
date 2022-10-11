import { TaskManager } from '@jujulego/tasks';
import { inject, injectable } from 'inversify';

import { type GlobalConfig, GLOBAL_CONFIG } from './inversify.config';
import { LoggerService } from './logger.service';

// Service
@injectable()
export class TaskManagerService extends TaskManager<any> {
  // Constructor
  constructor(
    @inject(GLOBAL_CONFIG) config: GlobalConfig,
    @inject(LoggerService) logger: LoggerService,
  ) {
    super({ jobs: config.jobs, logger });
  }
}
