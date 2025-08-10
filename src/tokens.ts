import { TaskManager } from '@jujulego/tasks';
import { inject$, token$ } from '@kyrielle/injector';
import { logger$, withTimestamp } from '@kyrielle/logger';
import { waitFor$ } from 'kyrielle';
import fs from 'node:fs';
import { PathScurry } from 'path-scurry';

// Tokens
export const LOGGER = token$('Logger', () => logger$(withTimestamp()));
export const PATH_SCURRY = token$('PathScurry', () => new PathScurry('/', { fs }));
export const TASK_MANAGER = token$('TaskManager', async () => {
  const { ConfigService } = await import('./config/config.service.js');

  return new TaskManager({
    jobs: (await waitFor$(inject$(ConfigService).config$)).jobs,
    logger: inject$(LOGGER),
  });
});