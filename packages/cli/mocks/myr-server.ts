import { Task } from '@jujulego/jill-myr';
import { setupServer } from 'msw/node';
import { graphql } from 'msw';

// Server setup
export const myrServer = setupServer(
  graphql.query<{ tasks: Task[] }>('Tasks', (req, res, ctx) => {
    return res(
      ctx.data({
        tasks: [
          {
            id: 'mock-1',
            cwd: '/mock',
            cmd: 'test',
            args: [],
            status: 'running'
          }
        ]
      })
    );
  }),
  graphql.mutation<{ spawn: Task }>('Spawn', (req, res, ctx) => {
    return res(
      ctx.data({
        spawn: {
          id: 'mock-spawn',
          cwd: req.body?.variables.cwd,
          cmd: req.body?.variables.cmd,
          args: req.body?.variables.args,
          status: 'running'
        }
      })
    );
  }),
  graphql.mutation<{ kill: Task }>('Kill', (req, res, ctx) => {
    return res(
      ctx.data({
        kill: {
          id: req.body?.variables.id,
          cwd: '/mock',
          cmd: 'test',
          args: [],
          status: 'failed'
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