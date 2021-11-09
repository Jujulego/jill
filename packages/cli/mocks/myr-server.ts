import { ITask } from '@jujulego/jill-myr';
import { setupServer } from 'msw/node';
import { graphql } from 'msw';

// Server setup
export const myrServer = setupServer(
  graphql.query<{ tasks: ITask[] }>('Tasks', (req, res, ctx) => {
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
  })
);