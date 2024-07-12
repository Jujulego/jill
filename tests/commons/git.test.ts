import { Logger } from '@jujulego/logger';
import { type TaskManager } from '@jujulego/tasks';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import '@/src/commons/logger.service.js';
import { CONFIG } from '@/src/config/config-loader.js';
import { GitService, type GitContext } from '@/src/commons/git.service.js';
import { container } from '@/src/inversify.config.js';
import { TASK_MANAGER } from '@/src/tasks/task-manager.config.js';

import { type TestSpawnTask } from '@/tools/test-tasks.js';

// Mocks
vi.mock('@jujulego/tasks', async (importOriginal) => {
  const mod: typeof import('@jujulego/tasks') = await importOriginal();

  return {
    ...mod,
    SpawnTask: class extends mod.SpawnTask {
      readonly emit = this._spawnEvents.emit;
    },
  };
});

// Setup
let logger: Logger;
let manager: TaskManager;
let git: GitService;

// Setup global config
container.rebind(CONFIG).toConstantValue({ jobs: 1 });

beforeEach(() => {
  vi.restoreAllMocks();

  // Services
  logger = container.get(Logger);
  manager = container.get(TASK_MANAGER);
  git = container.get(GitService);

  // Mocks
  vi.spyOn(manager, 'add').mockReturnValue(undefined);
});

// Test suites
describe('Git.command', () => {
  it('should create task and add it to global manager', () => {
    const task = git.command('cmd', ['arg1', 'arg2']);
    expect(manager.add).toHaveBeenCalledWith(task);

    expect(task.cmd).toBe('git');
    expect(task.args).toEqual(['cmd', 'arg1', 'arg2']);
    expect(task.context).toEqual({
      command: 'cmd',
      hidden: true,
    });
  });

  it('should redirect stdout data to logger (debug level)', () => {
    vi.spyOn(logger, 'debug');

    const task = git.command('cmd', ['arg1', 'arg2']) as TestSpawnTask<GitContext>;
    task.emit('stream.stdout', { stream: 'stdout', data: Buffer.from('test') });

    expect(logger.debug).toHaveBeenCalledWith('test');
  });

  it('should redirect stderr data to logger (debug level)', () => {
    vi.spyOn(logger, 'debug');

    const task = git.command('cmd', ['arg1', 'arg2']) as TestSpawnTask<GitContext>;
    task.emit('stream.stderr', { stream: 'stderr', data: Buffer.from('test') });

    expect(logger.debug).toHaveBeenCalledWith('test');
  });
});

describe.each(['branch', 'diff', 'tag'] as const)('git.%s', (cmd) => {
  // Tests
  it(`should call command with ${cmd}`, () => {
    const task = git[cmd](['arg1', 'arg2']);

    expect(task.cmd).toBe('git');
    expect(task.args).toEqual([cmd, 'arg1', 'arg2']);
    expect(task.context).toEqual({
      command: cmd,
      hidden: true,
    });
  });
});

describe('git.isAffected', () => {
  beforeEach(() => {
    vi.spyOn(git, 'diff');
  });

  // Tests
  it('should spawn git diff and return false if it exit with code 0', async () => {
    // Initiate task
    const prom = git.isAffected('master');

    expect(git.diff).toHaveBeenCalledWith(['--quiet', 'master', '--'], undefined);

    // Task complete
    const task = vi.mocked(git.diff).mock.results[0].value as TestSpawnTask<GitContext>;
    setTimeout(() => task.emit('status.done', { status: 'done', previous: 'running' }), 0);

    await expect(prom).resolves.toBe(false);
  });

  it('should spawn git diff and return true if it exit with code 1', async () => {
    // Initiate task
    const prom = git.isAffected('master');

    expect(git.diff).toHaveBeenCalledWith(['--quiet', 'master', '--'], undefined);

    // Task complete
    const task = vi.mocked(git.diff).mock.results[0].value as TestSpawnTask<GitContext>;

    vi.spyOn(task, 'exitCode', 'get').mockReturnValue(1);
    setTimeout(() => task.emit('status.failed', { status: 'failed', previous: 'running' }), 0);

    await expect(prom).resolves.toBe(true);
  });

  it('should spawn git diff and reject if it fails', async () => {
    // Initiate task
    const prom = git.isAffected('master');

    expect(git.diff).toHaveBeenCalledWith(['--quiet', 'master', '--'], undefined);

    // Task complete
    const task = vi.mocked(git.diff).mock.results[0].value as TestSpawnTask<GitContext>;

    setTimeout(() => task.emit('status.failed', { status: 'failed', previous: 'running' }), 0);

    await expect(prom).rejects.toEqual(new Error(`Task ${task.name} failed`));
  });
});

describe('git.listBranches', () => {
  beforeEach(() => {
    vi.spyOn(git, 'branch');
  });

  // Tests
  it('should call git branch -l', async () => {
    // Initiate task
    const prom = git.listBranches();

    expect(git.branch).toHaveBeenCalledWith(['-l'], undefined);

    // Complete task
    const task = vi.mocked(git.branch).mock.results[0].value as TestSpawnTask<GitContext>;

    task.emit('stream.stdout', { stream: 'stdout', data: Buffer.from(
      '  dev\n' +
      '  master\n' +
      '* feat/test\n'
    ) });

    vi.spyOn(task, 'exitCode', 'get').mockReturnValue(0);
    setTimeout(() => task.emit('completed', { status: 'done', duration: 1000 }), 0);

    await expect(prom).resolves.toEqual([
      'dev',
      'master',
      'feat/test',
    ]);
  });
});

describe('git.listTags', () => {
  beforeEach(() => {
    vi.spyOn(git, 'tag');
  });

  // Tests
  it('should call git tag -l', async () => {
    // Initiate task
    const prom = git.listTags();

    expect(git.tag).toHaveBeenCalledWith(['-l'], undefined);

    // Complete task
    const task = vi.mocked(git.tag).mock.results[0].value as TestSpawnTask<GitContext>;

    task.emit('stream.stdout', { stream: 'stdout', data: Buffer.from(
      '1.0.0\n' +
      '2.0.0\n' +
      '3.0.0\n'
    ) });

    vi.spyOn(task, 'exitCode', 'get').mockReturnValue(0);
    setTimeout(() => task.emit('completed', { status: 'done', duration: 1000 }), 0);

    await expect(prom).resolves.toEqual([
      '1.0.0',
      '2.0.0',
      '3.0.0',
    ]);
  });
});
