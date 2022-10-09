import { TaskManager } from '@jujulego/tasks';

import { logger } from './logger';

// Setup global manager
export const manager = new TaskManager<any>({ logger });
