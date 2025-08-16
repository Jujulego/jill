import { type GitContext, GitService } from '@/src/commons/git.service.js';
import { ConfigService } from '@/src/config/config.service.js';
import { LOGGER, TASK_MANAGER } from '@/src/tokens.js';
import { type SpawnTask, type TaskManager } from '@jujulego/tasks';
import { globalScope$, inject$ } from '@kyrielle/injector';
import type { Logger } from '@kyrielle/logger';
import { var$ } from 'kyrielle';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Setup
let logger: Logger;
let manager: TaskManager;
let git: GitService;

beforeEach(async () => {
  vi.restoreAllMocks();

  // Setup config
  vi.spyOn(inject$(ConfigService), 'config$', 'get')
    .mockReturnValue(var$({ jobs: 1, hooks: true }));

  // Services
  logger = inject$(LOGGER);
  manager = await inject$(TASK_MANAGER);
  git = inject$(GitService);

  // Mocks
  vi.spyOn(manager, 'add').mockReturnValue(undefined);
});

afterEach(() => {
  globalScope$().clear();
});

// Test suites
describe('GitService.command', () => {
  it('should create task and add it to global manager', async () => {
    const task = await git.command('cmd', ['arg1', 'arg2']);
    expect(manager.add).toHaveBeenCalledWith(task);

    expect(task.cmd).toBe('git');
    expect(task.args).toEqual(['cmd', 'arg1', 'arg2']);
    expect(task.context).toEqual({
      command: 'cmd',
      hidden: true,
    });
  });

  it('should redirect stdout data to logger (debug level)', async () => {
    vi.spyOn(logger, 'debug');

    const task = await git.command('cmd', ['arg1', 'arg2']);
    task.events$.emit('stream.stdout', { stream: 'stdout', data: Buffer.from('test') });

    expect(logger.debug).toHaveBeenCalledWith('test');
  });

  it('should redirect stderr data to logger (debug level)', async () => {
    vi.spyOn(logger, 'debug');

    const task = await git.command('cmd', ['arg1', 'arg2']);
    task.events$.emit('stream.stderr', { stream: 'stderr', data: Buffer.from('test') });

    expect(logger.debug).toHaveBeenCalledWith('test');
  });
});

describe.each(['branch', 'diff', 'tag'] as const)('GitService.%s', (cmd) => {
  // Tests
  it(`should call command with ${cmd}`, async () => {
    const task = await git[cmd](['arg1', 'arg2']);

    expect(task.cmd).toBe('git');
    expect(task.args).toEqual([cmd, 'arg1', 'arg2']);
    expect(task.context).toEqual({
      command: cmd,
      hidden: true,
    });
  });
});

describe('GitService.isAffected', () => {
  beforeEach(() => {
    vi.spyOn(git, 'diff');
  });

  // Tests
  it('should spawn git diff and return false if it exit with code 0', async () => {
    // Initiate task
    const prom = git.isAffected('master');

    expect(git.diff).toHaveBeenCalledWith(['--quiet', 'master', '--'], undefined);

    // Task complete
    const task = await vi.mocked(git.diff).mock.results[0].value as SpawnTask<GitContext>;
    task.events$.emit('status.done', { status: 'done', previous: 'running' });

    await expect(prom).resolves.toBe(false);
  });

  it('should spawn git diff and return true if it exit with code 1', async () => {
    // Initiate task
    const prom = git.isAffected('master');

    expect(git.diff).toHaveBeenCalledWith(['--quiet', 'master', '--'], undefined);

    // Task complete
    const task = await vi.mocked(git.diff).mock.results[0].value as SpawnTask<GitContext>;

    vi.spyOn(task, 'exitCode', 'get').mockReturnValue(1);
    task.events$.emit('status.failed', { status: 'failed', previous: 'running' });

    await expect(prom).resolves.toBe(true);
  });

  it('should spawn git diff and reject if it fails', async () => {
    // Initiate task
    const prom = git.isAffected('master');

    expect(git.diff).toHaveBeenCalledWith(['--quiet', 'master', '--'], undefined);

    // Task complete
    const task = await vi.mocked(git.diff).mock.results[0].value as SpawnTask<GitContext>;
    task.events$.emit('status.failed', { status: 'failed', previous: 'running' });

    await expect(prom).rejects.toEqual(new Error(`Task ${task.name} failed`));
  });
});

describe('GitService.listBranches', () => {
  beforeEach(() => {
    vi.spyOn(git, 'branch');
  });

  // Tests
  it('should call git branch -l', async () => {
    // Initiate task
    const prom = git.listBranches();

    expect(git.branch).toHaveBeenCalledWith(['-l'], undefined);

    // Complete task
    const task = await vi.mocked(git.branch).mock.results[0].value as SpawnTask<GitContext>;

    task.events$.emit('stream.stdout', { stream: 'stdout', data: Buffer.from(
      '  dev\n' +
      '  master\n' +
      '* feat/test\n'
    ) });

    vi.spyOn(task, 'exitCode', 'get').mockReturnValue(0);
    task.events$.emit('completed', { status: 'done', duration: 1000 });

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
    const task = await vi.mocked(git.tag).mock.results[0].value as SpawnTask<GitContext>;

    task.events$.emit('stream.stdout', { stream: 'stdout', data: Buffer.from(
      '1.0.0\n' +
      '2.0.0\n' +
      '3.0.0\n'
    ) });

    vi.spyOn(task, 'exitCode', 'get').mockReturnValue(0);
    task.events$.emit('completed', { status: 'done', duration: 1000 });

    await expect(prom).resolves.toEqual([
      '1.0.0',
      '2.0.0',
      '3.0.0',
    ]);
  });
});
