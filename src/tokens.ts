import { isWorkloadEnded, scheduler$, WorkloadState } from '@jujulego/tasks';
import { asyncScope$, inject$, token$ } from '@kyrielle/injector';
import { logger$, withTimestamp } from '@kyrielle/logger';
import { type Span, startInactiveSpan } from '@sentry/node';
import { type Unsubscribable, waitFor$ } from 'kyrielle';
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

export const SCHEDULER = token$('Scheduler', async () => {
  const config = await inject$(CONFIG, asyncScope$());
  const logger = inject$(LOGGER);

  const scheduler = scheduler$({
    strength: config.jobs,
  });

  scheduler.events$.on('started', (job) => {
    logger.verbose(`job "${job.label}" started`);
  });

  scheduler.events$.on('ended', (job) => {
    logger.verbose(`job "${job.label}" ended in state ${job.state()}`);
  });

  // Task instrumentation
  scheduler.events$.on('added', (job) => {
    const jobSpan = startInactiveSpan({
      op: 'job',
      name: job.label,
      attributes: {
        'job.id': job.id,
        'job.type': job.type,
        'job.weight': job.weight,
      }
    });

    // Status spans
    let stateSpan: Span | undefined;
    let subscription: Unsubscribable;

    job.state$.subscribe({
      start: (sub) => {
        subscription = sub;
      },
      next: (state) => {
        stateSpan?.end();

        if (isWorkloadEnded(state)) {
          jobSpan.setAttribute('job.final_state', state);
          jobSpan.setStatus({
            code: state === WorkloadState.Succeeded ? 1 : 2,
          });
          jobSpan.end();

          subscription.unsubscribe();
        } else {
          stateSpan = startInactiveSpan({
            op: 'job.state',
            name: state,
            parentSpan: jobSpan
          });
        }
      }
    });
  });

  return scheduler;
});
