import { fs, vol } from 'memfs';
import path from 'node:path';

import { Git } from '@/src/git';
import { Project } from '@/src/project/project';
import { Workspace } from '@/src/project/workspace';

import { TestBed } from '@/tools/test-bed';

// Mocks
jest.mock('fs', () => fs);
jest.mock('node:fs/promises', () => fs.promises);

// Setup
let bed: TestBed;
let wksA: Workspace;
let prjDir: string;

beforeEach(async () => {
  jest.resetAllMocks();

  // Build fake project
  bed = new TestBed();

  const wksC = bed.addWorkspace('wks-c', { scripts: { build: 'tsc' }});
  const wksB = bed.addWorkspace('wks-b', { scripts: { build: 'tsc' }})
    .addDependency(wksC, true);
  wksA = bed.addWorkspace('wks-a')
    .addDependency(wksB)
    .addDependency(wksC, true);

  prjDir = await bed.createProjectDirectory();
});

afterEach(() => {
  vol.reset();
});

// Test suites
describe('Workspace.dependencies', () => {
  let project: Project;
  let workspace: Workspace;

  beforeEach(() => {
    // Create test project
    project = new Project(prjDir);
    workspace = new Workspace(wksA.cwd, wksA.manifest, project);

    // Mocks
    jest.spyOn(project, 'workspace');
  });

  // Tests
  it('should return all workspace\'s dependencies', async () => {
    await expect(workspace.dependencies()).toYield([
      expect.objectContaining({ name: 'wks-b' })
    ]);

    expect(project.workspace).toHaveBeenCalledTimes(1);
    expect(project.workspace).toHaveBeenCalledWith('wks-b');
  });
});

describe('Workspace.devDependencies', () => {
  let project: Project;
  let workspace: Workspace;

  beforeEach(() => {
    // Create test project
    project = new Project(prjDir);
    workspace = new Workspace(wksA.cwd, wksA.manifest, project);

    // Mocks
    jest.spyOn(project, 'workspace');
  });

  // Tests
  it('should return all workspace\'s devDependencies', async () => {
    await expect(workspace.devDependencies()).toYield([
      expect.objectContaining({ name: 'wks-c' }),
    ]);

    expect(project.workspace).toHaveBeenCalledTimes(1);
    expect(project.workspace).toHaveBeenCalledWith('wks-c');
  });
});

describe('Workspace.run', () => {
  it('should return task with all build tree', async () => {
    jest.spyOn(bed.project, 'packageManager')
      .mockResolvedValue('yarn');

    const task = await wksA.run('test');

    // Check up tree
    expect(task).toEqual(expect.objectContaining({
      cmd: 'yarn',
      args: ['run', 'test'],
      cwd: path.resolve('test/wks-a'),
      dependencies: expect.arrayContaining([
        expect.objectContaining({
          cmd: 'yarn',
          args: ['run', 'build'],
          cwd: path.resolve('test/wks-b'),
          dependencies: [
            expect.objectContaining({
              cmd: 'yarn',
              args: ['run', 'build'],
              cwd: path.resolve('test/wks-c')
            })
          ]
        }),
        expect.objectContaining({
          cmd: 'yarn',
          args: ['run', 'build'],
          cwd: path.resolve('test/wks-c')
        })
      ])
    }));

    // Both workspace 'wks-c' task should be the same
    expect(task.dependencies[1]).toBe(task.dependencies[0].dependencies[0]);
    expect(bed.project.packageManager).toHaveBeenCalled();
  });
});

describe('Workspace.isAffected', () => {
  it('should return true', async () => {
    jest.spyOn(Git, 'isAffected').mockResolvedValue(true);

    await expect(wksA.isAffected('test'))
        .resolves.toBe(true);

    // Checks
    expect(Git.isAffected).toHaveBeenCalledTimes(1);
    expect(Git.isAffected).toHaveBeenCalledWith(
      'test',
      ['--', path.resolve('test/wks-a')],
      expect.objectContaining({ cwd: path.resolve('test') })
    );
  });

  it('should return false', async () => {
    jest.spyOn(Git, 'isAffected').mockResolvedValue(false);

    await expect(wksA.isAffected('test'))
      .resolves.toBe(false);

    // Checks
    expect(Git.isAffected).toHaveBeenCalledTimes(3);
    expect(Git.isAffected).toHaveBeenCalledWith(
      'test',
      ['--', path.resolve('test/wks-a')],
      expect.objectContaining({ cwd: path.resolve('test') })
    );
    expect(Git.isAffected).toHaveBeenCalledWith(
      'test',
      ['--', path.resolve('test/wks-b')],
      expect.objectContaining({ cwd: path.resolve('test') })
    );
    expect(Git.isAffected).toHaveBeenCalledWith(
      'test',
      ['--', path.resolve('test/wks-c')],
      expect.objectContaining({ cwd: path.resolve('test') })
    );
  });
});
