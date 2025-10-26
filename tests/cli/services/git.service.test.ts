import { GitService } from '@/src/cli/services/git.service.js';
import { CONFIG, LOGGER, SCHEDULER } from '@/src/tokens.js';
import { type Scheduler$, spawn$, type SpawnJob$, WorkloadState } from '@jujulego/tasks';
import { globalScope$, inject$ } from '@kyrielle/injector';
import type { Logger } from '@kyrielle/logger';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { var$ } from 'kyrielle';
import { ClientError } from '@/src/cli/utils/errors.js';
import { PassThrough } from 'node:stream';

// Mocks
vi.mock('@jujulego/tasks', async (original) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const mod = await original<typeof import('@jujulego/tasks')>();
  return { ...mod, spawn$: vi.fn(mod.spawn$) };
});

// Setup
let logger: Logger;
let scheduler: Scheduler$;
let git: GitService;

beforeEach(async () => {
  vi.restoreAllMocks();

  // Setup config
  globalScope$().set(CONFIG, Promise.resolve({ jobs: 1, hooks: true }));

  // Mocks
  scheduler = { register: vi.fn() } as unknown as Scheduler$;
  globalScope$().set(SCHEDULER, Promise.resolve(scheduler));

  // Services
  logger = inject$(LOGGER);
  git = inject$(GitService);
});

afterEach(() => {
  globalScope$().clear();
});

// Test suites
describe('GitService.command', () => {
  it('should create task and add it to global manager', async () => {
    const job = await git.command('cmd', ['arg1', 'arg2']);
    expect(scheduler.register).toHaveBeenCalledWith(job);

    expect(spawn$).toHaveBeenCalledWith('git', ['cmd', 'arg1', 'arg2'], {});
  });

  it('should redirect stdout data to logger (debug level)', async () => {
    vi.spyOn(logger, 'debug');

    const job = await git.command('cmd', ['arg1', 'arg2']);
    job.stdout.push(Buffer.from('test'));

    expect(logger.debug).toHaveBeenCalledWith('test');
  });

  it('should redirect stderr data to logger (warning level)', async () => {
    vi.spyOn(logger, 'warn');

    const job = await git.command('cmd', ['arg1', 'arg2']);
    job.stderr.push(Buffer.from('test'));

    expect(logger.warn).toHaveBeenCalledWith('test');
  });
});

describe.each(['branch', 'diff', 'tag'] as const)('GitService.%s', (cmd) => {
  beforeEach(() => {
    vi.spyOn(git, 'command');
  });

  // Tests
  it(`should call command with ${cmd}`, async () => {
    await git[cmd](['arg1', 'arg2']);

    expect(git.command).toHaveBeenCalledWith(cmd, ['arg1', 'arg2'], undefined);
  });
});

describe('GitService.isAffected', () => {
  beforeEach(() => {
    vi.spyOn(git, 'diff');
  });

  // Tests
  it('should spawn git diff and return false if it exit with code 0', async () => {
    vi.mocked(git.diff).mockResolvedValue({
      state$: var$(WorkloadState.Succeeded),
      exitCode: () => 0,
    } as unknown as SpawnJob$);

    // Call
    await expect(git.isAffected('master')).resolves.toBe(false);

    expect(git.diff).toHaveBeenCalledWith(['--quiet', 'master', '--'], undefined);
  });

  it('should spawn git diff and return true if it exit with code 1', async () => {
    vi.mocked(git.diff).mockResolvedValue({
      state$: var$(WorkloadState.Failed),
      exitCode: () => 1,
    } as unknown as SpawnJob$);

    // Call
    await expect(git.isAffected('master')).resolves.toBe(true);

    expect(git.diff).toHaveBeenCalledWith(['--quiet', 'master', '--'], undefined);
  });

  it('should spawn git diff and reject if it fails', async () => {
    vi.mocked(git.diff).mockResolvedValue({
      state$: var$(WorkloadState.Failed),
      exitCode: () => 2,
    } as unknown as SpawnJob$);

    // Call
    await expect(git.isAffected('master'))
      .rejects.toEqual(new ClientError('Error "git diff" command failed (exit code 2)'));
  });
});

describe('GitService.listBranches', () => {
  beforeEach(() => {
    vi.spyOn(git, 'branch');
  });

  // Tests
  it('should call git branch -l', async () => {
    const stdout = new PassThrough();
    stdout.push(Buffer.from(
      '  dev\n' +
      '  master\n' +
      '* feat/test\n'
    ));
    stdout.end();

    vi.mocked(git.branch).mockResolvedValue({ stdout } as unknown as SpawnJob$);

    await expect(git.listBranches()).resolves.toEqual([
      'dev',
      'master',
      'feat/test',
    ]);

    expect(git.branch).toHaveBeenCalledWith(['-l'], undefined);
  });
});

describe('git.listTags', () => {
  beforeEach(() => {
    vi.spyOn(git, 'tag');
  });

  // Tests
  it('should call git tag -l', async () => {
    const stdout = new PassThrough();
    stdout.push(Buffer.from(
      '1.0.0\n' +
      '2.0.0\n' +
      '3.0.0\n'
    ));
    stdout.end();

    vi.mocked(git.tag).mockResolvedValue({ stdout } as unknown as SpawnJob$);

    // Initiate task
    await expect(git.listTags()).resolves.toEqual([
      '1.0.0',
      '2.0.0',
      '3.0.0',
    ]);

    expect(git.tag).toHaveBeenCalledWith(['-l'], undefined);
  });
});
