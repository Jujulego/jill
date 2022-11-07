import path from 'node:path';

import { Project, Workspace } from '../../src/project';
import { Git } from '../../src/git';

// Setup
const root = path.resolve(__dirname, '../../mock');
let project: Project;
let workspace: Workspace;

beforeEach(async () => {
  project = new Project(root);
  workspace = (await project.workspace('mock-test-a'))!;

  // Mocks
  jest.restoreAllMocks();
  jest.spyOn(project, 'workspace');
  jest.spyOn(project, 'packageManager');
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

    expect(project.workspace).toHaveBeenCalledTimes(1);
    expect(project.workspace).toHaveBeenCalledWith('mock-test-b');
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

    expect(project.workspace).toHaveBeenCalledTimes(1);
    expect(project.workspace).toHaveBeenCalledWith('mock-test-c');
  });
});

describe('Workspace.run', () => {
  // Tests
  it('should return task with all build tree', async () => {
    (project.packageManager as jest.MockedFunction<typeof project.packageManager>)
      .mockResolvedValue('yarn');

    const task = await workspace.run('test');

    // Check up tree
    expect(task).toEqual(expect.objectContaining({
      cmd: 'yarn',
      args: ['run', 'test'],
      cwd: path.join(root, 'workspaces/test-a'),
      dependencies: expect.arrayContaining([
        expect.objectContaining({
          cmd: 'yarn',
          args: ['run', 'build'],
          cwd: path.join(root, 'workspaces/test-b'),
          dependencies: [
            expect.objectContaining({
              cmd: 'yarn',
              args: ['run', 'build'],
              cwd: path.join(root, 'workspaces/test-c')
            })
          ]
        }),
        expect.objectContaining({
          cmd: 'yarn',
          args: ['run', 'build'],
          cwd: path.join(root, 'workspaces/test-c')
        })
      ])
    }));

    // Both workspace 'mock-test-c' task should be the same
    expect(task.dependencies[1]).toBe(task.dependencies[0].dependencies[0]);
    expect(project.packageManager).toHaveBeenCalled();
  });
});

describe('Workspace.isAffected', () => {
  it('should return true', async () => {
    jest.spyOn(Git, 'isAffected').mockResolvedValue(true);

    await expect(workspace.isAffected('test'))
        .resolves.toBe(true);

    // Checks
    expect(Git.isAffected).toHaveBeenCalledTimes(1);
    expect(Git.isAffected).toHaveBeenCalledWith(
      'test',
      ['--',  path.join(root, 'workspaces/test-a')],
      expect.objectContaining({ cwd: root })
    );
  });

  it('should return false', async () => {
    jest.spyOn(Git, 'isAffected').mockResolvedValue(false);

    await expect(workspace.isAffected('test'))
      .resolves.toBe(false);

    // Checks
    expect(Git.isAffected).toHaveBeenCalledTimes(4);
    expect(Git.isAffected).toHaveBeenCalledWith(
      'test',
      ['--',  path.join(root, 'workspaces/test-a')],
      expect.objectContaining({ cwd: root })
    );
    expect(Git.isAffected).toHaveBeenCalledWith(
      'test',
      ['--',  path.join(root, 'workspaces/test-b')],
      expect.objectContaining({ cwd: root })
    );
    expect(Git.isAffected).toHaveBeenCalledWith(
      'test',
      ['--',  path.join(root, 'workspaces/test-c')],
      expect.objectContaining({ cwd: root })
    );
    expect(Git.isAffected).toHaveBeenCalledWith(
      'test',
      ['--',  path.join(root, 'workspaces/test-d')],
      expect.objectContaining({ cwd: root })
    );
  });
});
