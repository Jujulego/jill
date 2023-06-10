import { fs, vol } from 'memfs';
import path from 'node:path';

import { GitService } from '@/src/commons/git.service';
import { Logger } from '@/src/commons/logger.service';
import { container } from '@/src/inversify.config';
import { Project } from '@/src/project/project';
import { Workspace } from '@/src/project/workspace';

import { TestBed } from '@/tools/test-bed';

// Mocks
jest.mock('fs', () => fs);
jest.mock('node:fs/promises', () => fs.promises);

// Setup
let bed: TestBed;
let wksA: Workspace;
let wksB: Workspace;
let wksC: Workspace;
let prjDir: string;

let git: GitService;
let logger: Logger;

beforeAll(() => {
  container.snapshot();
});

beforeEach(async () => {
  container.restore();
  container.snapshot();

  // Build fake project
  bed = new TestBed();

  wksC = bed.addWorkspace('wks-c', { scripts: { build: 'tsc' }});
  wksB = bed.addWorkspace('wks-b', { scripts: { build: 'tsc' }})
    .addDependency(wksC, true);
  wksA = bed.addWorkspace('wks-a', { scripts: { test: 'jest' }})
    .addDependency(wksB)
    .addDependency(wksC, true);

  prjDir = await bed.createProjectDirectory();

  // Mocks
  jest.resetAllMocks();

  git = container.get(GitService);
  logger = container.get(Logger);
});

afterEach(() => {
  vol.reset();
});

// Test suites
describe('Workspace.dependencies', () => {
  let project: Project;

  beforeEach(() => {
    // Create test project
    project = new Project(prjDir, logger);

    // Mocks
    jest.spyOn(project, 'workspace');
  });

  // Tests
  it('should yield all workspace\'s dependencies', async () => {
    const workspace = new Workspace(wksA.cwd, wksA.manifest, project);

    await expect(workspace.dependencies()).toYield([
      expect.objectContaining({ name: 'wks-b' })
    ]);

    expect(project.workspace).toHaveBeenCalledTimes(1);
    expect(project.workspace).toHaveBeenCalledWith('wks-b');
  });

  it('should yield nothing if devDependencies empty', async () => {
    const workspace = new Workspace(wksC.cwd, wksC.manifest, project);

    await expect(workspace.dependencies()).toYield([]);

    expect(project.workspace).not.toHaveBeenCalled();
  });
});

describe('Workspace.devDependencies', () => {
  let project: Project;

  beforeEach(() => {
    // Create test project
    project = new Project(prjDir, logger);

    // Mocks
    jest.spyOn(project, 'workspace');
  });

  // Tests
  it('should yield all workspace\'s devDependencies', async () => {
    const workspace = new Workspace(wksA.cwd, wksA.manifest, project);

    await expect(workspace.devDependencies()).toYield([
      expect.objectContaining({ name: 'wks-c' }),
    ]);

    expect(project.workspace).toHaveBeenCalledTimes(1);
    expect(project.workspace).toHaveBeenCalledWith('wks-c');
  });

  it('should yield nothing if devDependencies empty', async () => {
    const workspace = new Workspace(wksC.cwd, wksC.manifest, project);

    await expect(workspace.devDependencies()).toYield([]);

    expect(project.workspace).not.toHaveBeenCalled();
  });
});

describe('Workspace.exec', () => {
  it('should return task with all build tree (yarn)', async () => {
    jest.spyOn(bed.project, 'packageManager')
      .mockResolvedValue('yarn');

    const task = await wksA.exec('test');

    // Check up tree
    expect(task).toEqual(expect.objectContaining({
      cmd: 'yarn',
      args: ['test'],
      cwd: path.resolve('test/wks-a'),
      dependencies: expect.arrayContaining([
        expect.objectContaining({
          script: 'build',
          workspace: wksB,
          dependencies: [
            expect.objectContaining({
              script: 'build',
              workspace: wksC,
            })
          ]
        }),
        expect.objectContaining({
          script: 'build',
          workspace: wksC,
        })
      ])
    }));

    // Both workspace 'wks-c' task should be the same
    expect(task.dependencies[1]).toBe(task.dependencies[0].dependencies[0]);
    expect(bed.project.packageManager).toHaveBeenCalled();
  });

  it('should return task with all build tree (not yarn)', async () => {
    jest.spyOn(bed.project, 'packageManager')
      .mockResolvedValue('npm');

    const task = await wksA.exec('test');

    // Check up tree
    expect(task).toEqual(expect.objectContaining({
      cmd: 'test',
      args: [],
      cwd: path.resolve('test/wks-a'),
      dependencies: expect.arrayContaining([
        expect.objectContaining({
          script: 'build',
          workspace: wksB,
          dependencies: [
            expect.objectContaining({
              script: 'build',
              workspace: wksC,
            })
          ]
        }),
        expect.objectContaining({
          script: 'build',
          workspace: wksC,
        })
      ])
    }));

    // Both workspace 'wks-c' task should be the same
    expect(task.dependencies[1]).toBe(task.dependencies[0].dependencies[0]);
    expect(bed.project.packageManager).toHaveBeenCalled();
  });
});

describe('Workspace.run', () => {
  it('should return task with all build tree', async () => {
    jest.spyOn(bed.project, 'packageManager')
      .mockResolvedValue('yarn');

    const task = await wksA.run('test');

    // Check up tree
    expect(task).toEqual(expect.objectContaining({
      script: 'test',
      workspace: wksA,
      dependencies: expect.arrayContaining([
        expect.objectContaining({
          script: 'build',
          workspace: wksB,
          dependencies: [
            expect.objectContaining({
              script: 'build',
              workspace: wksC,
            })
          ]
        }),
        expect.objectContaining({
          script: 'build',
          workspace: wksC,
        })
      ])
    }));

    // Both workspace 'wks-c' task should be the same
    expect(task!.dependencies[1]).toBe(task!.dependencies[0].dependencies[0]);
    expect(bed.project.packageManager).toHaveBeenCalled();
  });
});

describe('Workspace.isAffected', () => {
  it('should return true', async () => {
    jest.spyOn(git, 'isAffected').mockResolvedValue(true);

    await expect(wksA.isAffected('test'))
        .resolves.toBe(true);

    // Checks
    expect(git.isAffected).toHaveBeenCalledTimes(1);
    expect(git.isAffected).toHaveBeenCalledWith(
      'test',
      [path.resolve('test/wks-a')],
      expect.objectContaining({ cwd: path.resolve('test') })
    );
  });

  it('should return false', async () => {
    jest.spyOn(git, 'isAffected').mockResolvedValue(false);

    await expect(wksA.isAffected('test'))
      .resolves.toBe(false);

    // Checks
    expect(git.isAffected).toHaveBeenCalledTimes(3);
    expect(git.isAffected).toHaveBeenCalledWith(
      'test',
      [path.resolve('test/wks-a')],
      expect.objectContaining({ cwd: path.resolve('test') })
    );
    expect(git.isAffected).toHaveBeenCalledWith(
      'test',
      [path.resolve('test/wks-b')],
      expect.objectContaining({ cwd: path.resolve('test') })
    );
    expect(git.isAffected).toHaveBeenCalledWith(
      'test',
      [path.resolve('test/wks-c')],
      expect.objectContaining({ cwd: path.resolve('test') })
    );
  });
});
