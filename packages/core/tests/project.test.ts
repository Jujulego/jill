import { promises as fs } from 'fs';
import path from 'path';
import glob from 'tiny-glob';

import { Project, Workspace } from '../src';

// Mock
jest.mock('tiny-glob');

// Setup
const root = path.resolve(__dirname, '../../../mock');
let project: Project;

beforeEach(() => {
  project = new Project(root);

  // Mocks
  jest.restoreAllMocks();
  jest.spyOn(fs, 'readFile');

  (glob as jest.MockedFunction<typeof glob>)
    .mockResolvedValue(['workspaces/test-a', 'workspaces/test-b', 'workspaces/test-c']);
});

// Test suite
describe('Project.mainWorkspace', () => {
  // Tests
  it('should return root workspace', async () => {
    await expect(project.mainWorkspace())
      .resolves.toEqual(expect.any(Workspace));

    await expect(project.mainWorkspace())
      .resolves.toEqual(expect.objectContaining({
        cwd: root,
        name: 'mock-root',
        project: project
      }));

    // Checks
    expect(fs.readFile).toBeCalledTimes(1);
    expect(fs.readFile).toBeCalledWith(path.join(root, 'package.json'), 'utf-8');
  });
});

describe('Project.workspaces', () => {
  // Tests
  it('should return all workspaces', async () => {
    const gen = project.workspaces();

    // Should first yield main workspace
    await expect(gen.next())
      .resolves.toEqual({
        done: false,
        value: expect.objectContaining({ name: 'mock-root' })
      });

    // Then all others workspaces
    await expect(gen.next())
      .resolves.toEqual({
        done: false,
        value: expect.objectContaining({ name: 'mock-test-a' })
      });

    await expect(gen.next())
      .resolves.toEqual({
        done: false,
        value: expect.objectContaining({ name: 'mock-test-b' })
      });

    await expect(gen.next())
      .resolves.toEqual({
        done: false,
        value: expect.objectContaining({ name: 'mock-test-c' })
      });

    await expect(gen.next())
      .resolves.toEqual({
        done: true
      });
  });
});

describe('Project.workspace', () => {
  // Tests
  it('should return current directory workspace', async () => {
    jest.spyOn(process, 'cwd').mockReturnValue(path.join(root, 'workspaces/test-a'));

    await expect(project.workspace())
      .resolves.toEqual(expect.objectContaining({
        cwd: path.join(root, 'workspaces/test-a'),
        name: 'mock-test-a'
      }));

    // Checks
    expect(fs.readFile).toBeCalledTimes(1);
    expect(fs.readFile).toBeCalledWith(path.join(root, 'workspaces/test-a/package.json'), 'utf-8');
  });

  it('should return named workspace', async () => {
    (glob as jest.MockedFunction<typeof glob>)
      .mockResolvedValue(['workspaces/test-a']);

    await expect(project.workspace('mock-test-a'))
      .resolves.toEqual(expect.objectContaining({ name: 'mock-test-a' }));

    // Checks
    expect(glob).toBeCalledWith('workspaces/*', { cwd: root });
    expect(fs.readFile).toBeCalledTimes(2);
    expect(fs.readFile).toBeCalledWith(path.join(root, 'package.json'), 'utf-8');
    expect(fs.readFile).toBeCalledWith(path.join(root, 'workspaces/test-a/package.json'), 'utf-8');
  });

  it('should return named workspace', async () => {
    await expect(project.workspace('does-not-exists'))
      .resolves.toBeNull();

    // Checks
    expect(glob).toBeCalledWith('workspaces/*', { cwd: root });
    expect(fs.readFile).toBeCalledTimes(4);
    expect(fs.readFile).toBeCalledWith(path.join(root, 'package.json'), 'utf-8');
    expect(fs.readFile).toBeCalledWith(path.join(root, 'workspaces/test-a/package.json'), 'utf-8');
    expect(fs.readFile).toBeCalledWith(path.join(root, 'workspaces/test-b/package.json'), 'utf-8');
    expect(fs.readFile).toBeCalledWith(path.join(root, 'workspaces/test-c/package.json'), 'utf-8');
  });
});
