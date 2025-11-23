import type { ScriptWorkflow$ } from '@/src/jobs/run-script$.js';
import { GitService } from '@/src/services/git.service.js';
import { Project } from '@/src/projects/project.js';
import { Workspace } from '@/src/projects/workspace.js';
import { CONFIG } from '@/src/tokens.js';
import { TestBed } from '@/tools/test-bed.js';
import { globalScope$, inject$ } from '@kyrielle/injector';
import { vol } from 'memfs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mocks
vi.mock('node:fs', async () => {
  const { fs } = await import('memfs');
  return ({ default: fs });
});

// Setup
let bed: TestBed;
let wksA: Workspace;
let wksB: Workspace;
let wksC: Workspace;
let prjDir: string;

let git: GitService;

beforeEach(async () => {
  vi.resetAllMocks();

  // Build fake project
  bed = new TestBed();

  wksC = bed.addWorkspace('wks-c', { scripts: { build: 'tsc' }});
  wksB = bed.addWorkspace('wks-b', { scripts: { build: 'tsc' }})
    .addDependency(wksC, true);
  wksA = bed.addWorkspace('wks-a', { scripts: { test: 'jest' }})
    .addDependency(wksB)
    .addDependency(wksC, true);

  prjDir = await bed.createProjectDirectory();

  // Setup config
  globalScope$().set(CONFIG, Promise.resolve({ jobs: 1, hooks: true }));

  // Mocks
  git = inject$(GitService);
});

afterEach(() => {
  globalScope$().clear();
  vol.reset();
});

// Test suites
describe('Workspace.dependencies', () => {
  let project: Project;

  beforeEach(() => {
    // Create test project
    project = new Project(prjDir);

    // Mocks
    vi.spyOn(project, 'workspace');
  });

  // Tests
  it('should yield all workspace\'s dependencies', async () => {
    const workspace = new Workspace(wksA.root, wksA.manifest, project);

    await expect(workspace.dependencies()).toYield([
      expect.objectContaining({ name: 'wks-b' })
    ]);

    expect(project.workspace).toHaveBeenCalledTimes(1);
    expect(project.workspace).toHaveBeenCalledWith('wks-b');
  });

  it('should yield nothing if devDependencies empty', async () => {
    const workspace = new Workspace(wksC.root, wksC.manifest, project);

    await expect(workspace.dependencies()).toYield([]);

    expect(project.workspace).not.toHaveBeenCalled();
  });
});

describe('Workspace.devDependencies', () => {
  let project: Project;

  beforeEach(() => {
    // Create test project
    project = new Project(prjDir);

    // Mocks
    vi.spyOn(project, 'workspace');
  });

  // Tests
  it('should yield all workspace\'s devDependencies', async () => {
    const workspace = new Workspace(wksA.root, wksA.manifest, project);

    await expect(workspace.devDependencies()).toYield([
      expect.objectContaining({ name: 'wks-c' }),
    ]);

    expect(project.workspace).toHaveBeenCalledTimes(1);
    expect(project.workspace).toHaveBeenCalledWith('wks-c');
  });

  it('should yield nothing if devDependencies empty', async () => {
    const workspace = new Workspace(wksC.root, wksC.manifest, project);

    await expect(workspace.devDependencies()).toYield([]);

    expect(project.workspace).not.toHaveBeenCalled();
  });
});

describe('Workspace.exec', () => {
  it('should return task with all build tree (yarn)', async () => {
    vi.spyOn(bed.project, 'packageManager')
      .mockResolvedValue('yarn');

    const job = await wksA.exec('test');

    expect(job.cmd).toBe('yarn exec test');
    expect(job.cwd).toBe(path.resolve('test/wks-a'));

    // Check up tree
    const deps = job.dependencies() as readonly ScriptWorkflow$[];
    expect(deps).toHaveLength(2);

    expect(deps[0].script).toBe('build');
    expect(deps[0].workspace).toBe(wksB);
    expect(deps[0].dependencies()).toHaveLength(1);

    expect(deps[1].script).toBe('build');
    expect(deps[1].workspace).toBe(wksC);
    expect(deps[1].dependencies()).toHaveLength(0);

    expect(deps[1]).toBe(deps[0].dependencies()[0]);

    expect(bed.project.packageManager).toHaveBeenCalled();
  });

  it('should return task with all build tree (not yarn)', async () => {
    vi.spyOn(bed.project, 'packageManager')
      .mockResolvedValue('npm');

    const job = await wksA.exec('test');

    expect(job.cmd).toBe('test');
    expect(job.cwd).toBe(path.resolve('test/wks-a'));

    // Check up tree
    const deps = job.dependencies() as readonly ScriptWorkflow$[];
    expect(deps).toHaveLength(2);

    expect(deps[0].script).toBe('build');
    expect(deps[0].workspace).toBe(wksB);
    expect(deps[0].dependencies()).toHaveLength(1);

    expect(deps[1].script).toBe('build');
    expect(deps[1].workspace).toBe(wksC);
    expect(deps[1].dependencies()).toHaveLength(0);

    expect(deps[1]).toBe(deps[0].dependencies()[0]);

    expect(bed.project.packageManager).toHaveBeenCalled();
  });
});

describe('Workspace.run', () => {
  it('should return task with all build tree', async () => {
    vi.spyOn(bed.project, 'packageManager')
      .mockResolvedValue('yarn');

    const flow = await wksA.run('test');

    // Check up tree
    expect(flow).toBeDefined();
    expect(flow!.script).toBe('test');
    expect(flow!.workspace).toBe(wksA);

    const deps = flow!.dependencies() as readonly ScriptWorkflow$[];
    expect(deps).toHaveLength(2);

    expect(deps[0].script).toBe('build');
    expect(deps[0].workspace).toBe(wksB);
    expect(deps[0].dependencies()).toHaveLength(1);

    expect(deps[1].script).toBe('build');
    expect(deps[1].workspace).toBe(wksC);
    expect(deps[1].dependencies()).toHaveLength(0);

    expect(deps[1]).toBe(deps[0].dependencies()[0]);

    expect(bed.project.packageManager).toHaveBeenCalled();
  });
});

describe('Workspace.isAffected', () => {
  it('should return true', async () => {
    vi.spyOn(git, 'isAffected').mockResolvedValue(true);

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
    vi.spyOn(git, 'isAffected').mockResolvedValue(false);

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
