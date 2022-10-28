import { SpawnTask, TaskManager } from '@jujulego/tasks';

import { Git, GitContext } from '../src';
import { container, Logger } from '../src/services';

// Setup
let logger: Logger;
let manager: TaskManager;

beforeEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();

  // Services
  logger = container.get(Logger);
  manager = container.get(TaskManager);

  // Mocks
  jest.spyOn(manager, 'add').mockImplementation();
});

// Test suites
describe('Git.command', () => {
  it('should create task and add it to global manager', () => {
    const task = Git.command('cmd', ['arg1', 'arg2']);
    expect(manager.add).toHaveBeenCalledWith(task);

    expect(task.cmd).toBe('git');
    expect(task.args).toEqual(['cmd', 'arg1', 'arg2']);
    expect(task.context).toEqual({ command: 'cmd' });
  });

  it('should redirect stdout data to logger (debug level)', () => {
    jest.spyOn(logger, 'debug');

    const task = Git.command('cmd', ['arg1', 'arg2']);
    task.emit('stream.stdout', { stream: 'stdout', data: Buffer.from('test') });

    expect(logger.debug).toHaveBeenCalledWith('test');
  });

  it('should redirect stderr data to logger (debug level)', () => {
    jest.spyOn(logger, 'debug');

    const task = Git.command('cmd', ['arg1', 'arg2']);
    task.emit('stream.stderr', { stream: 'stderr', data: Buffer.from('test') });

    expect(logger.debug).toHaveBeenCalledWith('test');
  });
});

for (const cmd of ['branch', 'diff', 'tag'] as const) {
  describe(`Git.${cmd}`, () => {
    // Tests
    it(`should call command with ${cmd}`, () => {
      const task = Git[cmd](['arg1', 'arg2']);

      expect(task.cmd).toBe('git');
      expect(task.args).toEqual([cmd, 'arg1', 'arg2']);
      expect(task.context).toEqual({ command: cmd });
    });
  });
}

describe('Git.isAffected', () => {
  beforeEach(() => {
    jest.spyOn(Git, 'diff');
  });

  // Tests
  it('should spawn git diff and return false if it exit with code 0', async () => {
    // Initiate task
    const prom = Git.isAffected('master');

    expect(Git.diff).toHaveBeenCalledWith(['--quiet', 'master'], undefined);

    // Task complete
    const task = jest.mocked(Git.diff).mock.results[0].value as SpawnTask<GitContext>;
    setTimeout(() => task.emit('status.done', { status: 'done', previous: 'running' }), 0);

    await expect(prom).resolves.toBe(false);
  });

  it('should spawn git diff and return true if it exit with code 1', async () => {
    // Initiate task
    const prom = Git.isAffected('master');

    expect(Git.diff).toHaveBeenCalledWith(['--quiet', 'master'], undefined);

    // Task complete
    const task = jest.mocked(Git.diff).mock.results[0].value as SpawnTask<GitContext>;

    jest.spyOn(task, 'exitCode', 'get').mockReturnValue(1);
    setTimeout(() => task.emit('status.failed', { status: 'failed', previous: 'running' }), 0);

    await expect(prom).resolves.toBe(true);
  });

  it('should spawn git diff and reject if it fails', async () => {
    // Initiate task
    const prom = Git.isAffected('master');

    expect(Git.diff).toHaveBeenCalledWith(['--quiet', 'master'], undefined);

    // Task complete
    const task = jest.mocked(Git.diff).mock.results[0].value as SpawnTask<GitContext>;

    setTimeout(() => task.emit('status.failed', { status: 'failed', previous: 'running' }), 0);

    await expect(prom).rejects.toEqual(new Error(`Task ${task.name} failed`));
  });
});

describe('git.listBranches', () => {
  beforeEach(() => {
    jest.spyOn(Git, 'branch');
  });

  // Tests
  it('should call git branch -l', async () => {
    // Initiate task
    const prom = Git.listBranches();

    expect(Git.branch).toHaveBeenCalledWith(['-l'], undefined);

    // Complete task
    const task = jest.mocked(Git.branch).mock.results[0].value as SpawnTask<GitContext>;

    task.emit('stream.stdout', { stream: 'stdout', data: Buffer.from(
      '  dev\n' +
      '  master\n' +
      '* feat/test\n'
    ) });

    jest.spyOn(task, 'exitCode', 'get').mockReturnValue(0);
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
    jest.spyOn(Git, 'tag');
  });

  // Tests
  it('should call git tag -l', async () => {
    // Initiate task
    const prom = Git.listTags();

    expect(Git.tag).toHaveBeenCalledWith(['-l'], undefined);

    // Complete task
    const task = jest.mocked(Git.tag).mock.results[0].value as SpawnTask<GitContext>;

    task.emit('stream.stdout', { stream: 'stdout', data: Buffer.from(
      '1.0.0\n' +
      '2.0.0\n' +
      '3.0.0\n'
    ) });

    jest.spyOn(task, 'exitCode', 'get').mockReturnValue(0);
    setTimeout(() => task.emit('completed', { status: 'done', duration: 1000 }), 0);

    await expect(prom).resolves.toEqual([
      '1.0.0',
      '2.0.0',
      '3.0.0',
    ]);
  });
});
