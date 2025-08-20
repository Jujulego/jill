import { TaskManager } from '@jujulego/tasks';
import { asyncScope$, inject$, token$ } from '@kyrielle/injector';
import { logger$, withTimestamp } from '@kyrielle/logger';
import { startInactiveSpan, type Span, getRootSpan, getActiveSpan } from '@sentry/node';
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
  const manager = new TaskManager({
    jobs: (await inject$(CONFIG, asyncScope$())).jobs,
    logger: inject$(LOGGER),
  });

  let rootSpan = getActiveSpan();
  if (rootSpan) rootSpan = getRootSpan(rootSpan);

  const spans = new Map<string, Span>();

  manager.events$.on('added', (task) => {
    // Main span
    const span = startInactiveSpan({
      name: task.name,
      parentSpan: (task.group && spans.get(task.group.id)) ?? rootSpan,
      op: 'task',
    });
    task.events$.on('completed', ({ status }) => {
      span.setStatus({ code: status === 'done' ? 1 : 2 });
      span.end();
    });
    spans.set(task.id, span);

    // Status spans
    let statusSpan = startInactiveSpan({ name: task.status, parentSpan: span, op: 'task.status' });

    task.events$.on('status', ({ status }) => {
      statusSpan.end();

      if (!task.completed) {
        statusSpan = startInactiveSpan({ name: status, parentSpan: span, op: 'task.status' });
      }
    });
  });

  return manager;
});
