import { promises as fs } from 'fs';
import path from 'path';
import glob from 'tiny-glob';

import { Project, Workspace } from '../src';
import './logger';

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
    .mockResolvedValue(['workspaces/test-a', 'workspaces/test-b', 'workspaces/test-c', 'workspaces/test-d']);
});

// Test suites
describe('Project.searchProjectRoot', () => {
  // Test
  it('should return mock root', async () => {
    await expect(Project.searchProjectRoot(root))
      .resolves.toEqual(root);
  });

  it('should return mock root from workspace', async () => {
    await expect(Project.searchProjectRoot(path.join(root, 'workspaces/test-a')))
      .resolves.toEqual(root);
  });
});

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
    expect(fs.readFile).toHaveBeenCalledTimes(1);
    expect(fs.readFile).toHaveBeenCalledWith(path.join(root, 'package.json'), 'utf-8');
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
        done: false,
        value: expect.objectContaining({ name: 'mock-test-d' })
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
    expect(fs.readFile).toHaveBeenCalledTimes(1);
    expect(fs.readFile).toHaveBeenCalledWith(path.join(root, 'workspaces/test-a/package.json'), 'utf-8');
  });

  it('should return named workspace', async () => {
    (glob as jest.MockedFunction<typeof glob>)
      .mockResolvedValue(['workspaces/test-a']);

    await expect(project.workspace('mock-test-a'))
      .resolves.toEqual(expect.objectContaining({ name: 'mock-test-a' }));

    // Checks
    expect(glob).toHaveBeenCalledWith('workspaces/*', { cwd: root });
    expect(fs.readFile).toHaveBeenCalledTimes(2);
    expect(fs.readFile).toHaveBeenCalledWith(path.join(root, 'package.json'), 'utf-8');
    expect(fs.readFile).toHaveBeenCalledWith(path.join(root, 'workspaces/test-a/package.json'), 'utf-8');
  });

  it('should fail to return unknown workspace', async () => {
    await expect(project.workspace('does-not-exists'))
      .resolves.toBeNull();

    // Checks
    expect(glob).toHaveBeenCalledWith('workspaces/*', { cwd: root });
    expect(fs.readFile).toHaveBeenCalledTimes(5);
    expect(fs.readFile).toHaveBeenCalledWith(path.join(root, 'package.json'), 'utf-8');
    expect(fs.readFile).toHaveBeenCalledWith(path.join(root, 'workspaces/test-a/package.json'), 'utf-8');
    expect(fs.readFile).toHaveBeenCalledWith(path.join(root, 'workspaces/test-b/package.json'), 'utf-8');
    expect(fs.readFile).toHaveBeenCalledWith(path.join(root, 'workspaces/test-c/package.json'), 'utf-8');
    expect(fs.readFile).toHaveBeenCalledWith(path.join(root, 'workspaces/test-d/package.json'), 'utf-8');
  });
});

describe('Project.packageManager', () => {
  beforeEach(() => {
    jest.spyOn(fs, 'readdir');
  });

  // Test
  it('should return \'yarn\'', async () => {
    (fs.readdir as jest.MockedFunction<any>)
      .mockResolvedValue(['yarn.lock']);

    // Test
    await expect(project.packageManager())
      .resolves.toBe('yarn');

    expect(fs.readdir).toHaveBeenCalledWith(root);
  });

  it('should return \'npm\'', async () => {
    (fs.readdir as jest.MockedFunction<any>)
      .mockResolvedValue(['package-lock.json']);

    // Test
    await expect(project.packageManager())
      .resolves.toBe('npm');

    expect(fs.readdir).toHaveBeenCalledWith(root);
  });

  it('should return \'npm\' (nothing recognized)', async () => {
    (fs.readdir as jest.MockedFunction<any>)
      .mockResolvedValue([]);

    // Test
    await expect(project.packageManager())
      .resolves.toBe('npm');

    expect(fs.readdir).toHaveBeenCalledWith(root);
  });

  it('should return packageManager from options', async () => {
    const prj = new Project(root, { packageManager: 'yarn' });

    // Test
    await expect(prj.packageManager())
      .resolves.toBe('yarn');

    expect(fs.readdir).not.toHaveBeenCalled();
  });
});
