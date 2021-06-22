import path from 'path';

import { Project, Workspace } from '../src';

// Setup
const root = path.resolve(__dirname, '../../../mock');
let project: Project;
let workspace: Workspace;

beforeEach(async () => {
  project = new Project(root);
  workspace = (await project.workspace('mock-test-a'))!;

  // Mocks
  jest.restoreAllMocks();
  jest.spyOn(project, 'workspace');
});

// Test suites
describe('Workspace.dependencies', () => {
  // Tests
  it('should return all workspace\'s dependencies', async () => {
    const gen = workspace.dependencies();

    await expect(gen.next())
      .resolves.toEqual({
        done: false,
        value: expect.objectContaining({ name: 'mock-test-b' })
      });

    await expect(gen.next())
      .resolves.toEqual({
        done: true
      });

    expect(project.workspace).toBeCalledTimes(1);
    expect(project.workspace).toBeCalledWith('mock-test-b');
  });
});

describe('Workspace.devDependencies', () => {
  // Tests
  it('should return all workspace\'s devDependencies', async () => {
    const gen = workspace.devDependencies();

    await expect(gen.next())
      .resolves.toEqual({
        done: false,
        value: expect.objectContaining({ name: 'mock-test-c' })
      });

    await expect(gen.next())
      .resolves.toEqual({
        done: true
      });

    expect(project.workspace).toBeCalledTimes(1);
    expect(project.workspace).toBeCalledWith('mock-test-c');
  });
});

describe('Workspace.run', () => {
  // Tests
  it('should return task with all build tree', async () => {
    const task = await workspace.run('test');

    // Check up tree
    expect(task).toEqual(expect.objectContaining({
      cmd: 'yarn',
      args: ['test'],
      cwd: path.join(root, 'workspaces/test-a'),
      dependencies: [
        expect.objectContaining({
          cmd: 'yarn',
          args: ['jill:build'],
          cwd: path.join(root, 'workspaces/test-b'),
          dependencies: [
            expect.objectContaining({
              cmd: 'yarn',
              args: ['jill:build'],
              cwd: path.join(root, 'workspaces/test-c')
            }),
            expect.objectContaining({
              cmd: 'yarn',
              args: ['jill:build'],
              cwd: path.join(root, 'workspaces/test-d')
            })
          ]
        }),
        expect.objectContaining({
          cmd: 'yarn',
          args: ['jill:build'],
          cwd: path.join(root, 'workspaces/test-c')
        })
      ]
    }));

    // Both workspace 'mock-test-c' task should be the same
    expect(task.dependencies[1]).toBe(task.dependencies[0].dependencies[0]);
  });
});
