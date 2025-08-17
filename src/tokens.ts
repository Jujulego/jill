import { TaskManager } from '@jujulego/tasks';
import { asyncScope$, inject$, token$ } from '@kyrielle/injector';
import { logger$, withTimestamp } from '@kyrielle/logger';
import { waitFor$ } from 'kyrielle';
import fs from 'node:fs';
import process from 'node:process';
import { PathScurry } from 'path-scurry';

// Tokens
export const CONFIG = token$('Config', async () => {
  const { ConfigService } = await import('./config/config.service.js');
  return waitFor$(inject$(ConfigService, asyncScope$()).config$);
});
export const CWD = token$('cwd', () => process.cwd());
export const LOGGER = token$('Logger', () => logger$(withTimestamp()));
export const PATH_SCURRY = token$('PathScurry', () => new PathScurry('/', { fs }));
export const TASK_MANAGER = token$('TaskManager', async () => {
  return new TaskManager({
    jobs: (await inject$(CONFIG, asyncScope$())).jobs,
    logger: inject$(LOGGER),
  });
});
