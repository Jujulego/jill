import { Project } from '@jujulego/jill-core';

import { MyrClient } from '../../src/myr/myr-client';
import { myrServer } from '../../mocks/myr-server';

// Setup
beforeAll(() => {
  myrServer.listen();
});

let project: Project;

beforeEach(() => {
  jest.resetAllMocks();

  project = new Project('.');
});

afterEach(() => {
  myrServer.resetHandlers();
});

afterAll(() => {
  myrServer.close();
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