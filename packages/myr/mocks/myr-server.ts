import { setupServer } from 'msw/node';
import { graphql } from 'msw';

import { FWatchTask, SpawnTaskMode, WatchTaskStatus } from '../src/common';

// Server setup
export const myrServer = setupServer(
  graphql.query<{ tasks: FWatchTask[] }>('Tasks', (req, res, ctx) => {
    return res(
      ctx.data({
        tasks: [
          {
            id: 'mock-1',
            cwd: '/mock',
            cmd: 'test',
            args: [],
            status: WatchTaskStatus.running,
            mode: SpawnTaskMode.managed,
          }
        ]
      })
    );
  }),
  graphql.query<{ logs: any[] }>('Logs', (req, res, ctx) => {
    return res(
      ctx.data({
        logs: [
          { level: 'test', message: 'Mock is working' }
        ]
      })
    );
  }),
  graphql.mutation<{ spawn: FWatchTask }>('Spawn', (req, res, ctx) => {
    return res(
      ctx.data({
        spawn: {
          id: 'mock-spawn',
          cwd: req.body?.variables.cwd,
          cmd: req.body?.variables.cmd,
          args: req.body?.variables.args,
          status: req.body?.variables.mode === SpawnTaskMode.auto ? WatchTaskStatus.ready : WatchTaskStatus.running,
          mode: req.body?.variables.mode ?? SpawnTaskMode.managed,
        }
      })
    );
  }),
  graphql.mutation<{ kill: FWatchTask }>('Kill', (req, res, ctx) => {
    return res(
      ctx.data({
        kill: {
          id: req.body?.variables.id,
          cwd: '/mock',
          cmd: 'test',
          args: [],
          status: WatchTaskStatus.failed,
          mode: SpawnTaskMode.managed,
        }
      })
    );
  }),
  graphql.mutation<{ shutdown: boolean }>('Shutdown', (req, res, ctx) => {
    return res(
      ctx.data({
        shutdown: true
      })
    );
  })
);
