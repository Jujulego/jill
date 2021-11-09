import { Project } from '@jujulego/jill-core';
import { ITask } from '@jujulego/jill-myr';
import { graphql } from 'msw';
import { setupServer } from 'msw/node';

import { MyrClient } from '../../src/myr/myr-client';

// Server setup
const server = setupServer(
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

// Setup
beforeAll(() => {
  server.listen();
});

let project: Project;

beforeEach(() => {
  jest.resetAllMocks();

  project = new Project('.');
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// Test suites
describe('MyrClient.tasks', () => {
  // Tests
  it('should return all tasks', async () => {
    const myr = new MyrClient(project);

    await expect(myr.tasks()).resolves.toEqual([
      {
        id: 'mock-1',
        cwd: '/mock',
        cmd: 'test',
        args: [],
        status: 'running'
      }
    ]);
  });
});