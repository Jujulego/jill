import { Project, Workspace } from '@jujulego/jill-core';
import path from 'path';

import { MyrClient } from '../../src/myr/myr-client';
import { myrServer } from '../../mocks/myr-server';

// Setup
beforeAll(() => {
  myrServer.listen();
});

let prj: Project;
let wks: Workspace;

beforeEach(() => {
  jest.resetAllMocks();

  prj = new Project('/prj');
  wks = new Workspace('wks', { name: 'wks' }, prj);

  jest.spyOn(prj, 'packageManager').mockResolvedValue('yarn');
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
    const myr = new MyrClient(prj);

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

describe('MyrClient.spawn', () => {
  // Tests
  it('should return spawned task', async () => {
    const myr = new MyrClient(prj);

    await expect(myr.spawn('/project', 'test', ['--arg'])).resolves.toEqual({
      id: 'mock-spawn',
      cwd: '/project',
      cmd: 'test',
      args: ['--arg'],
      status: 'running'
    });
  });
});

describe('MyrClient.spawnScript', () => {
  // Tests
  it('should return spawned script task', async () => {
    const myr = new MyrClient(prj);

    await expect(myr.spawnScript(wks, 'test', ['--arg'])).resolves.toEqual({
      id: 'mock-spawn',
      cwd: path.resolve('/prj/wks'),
      cmd: 'yarn',
      args: ['test', '--arg'],
      status: 'running'
    });
  });
});

describe('MyrClient.kill', () => {
  // Tests
  it('should return killed task', async () => {
    const myr = new MyrClient(prj);

    await expect(myr.kill('mock-kill')).resolves.toEqual({
      id: 'mock-kill',
      cwd: '/mock',
      cmd: 'test',
      args: [],
      status: 'failed'
    });
  });
});