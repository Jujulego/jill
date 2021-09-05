import { git, TaskManager, SpawnTask } from '../src';

import './utils/logger';
import { TestSpawnTask } from './utils/task';

// Types
type GitCommand = 'branch' | 'diff' | 'tag';

// Setup
const manager = new TaskManager();

beforeEach(() => {
  jest.resetAllMocks();

  // Mocks
  jest.spyOn(TaskManager, 'global', 'get')
    .mockReturnValue(manager);

  jest.spyOn(manager, 'add').mockImplementation();
});

// Test suites
describe('git.command', () => {
  it('should create task and add it to global manager', async () => {
    const task = git.command('cmd', ['arg1', 'arg2']);
    expect(manager.add).toHaveBeenCalledWith(task);

    expect(task.cmd).toBe('git');
    expect(task.args).toEqual(['cmd', 'arg1', 'arg2']);
  });

  it('should create task and add it to given manager', async () => {
    const mng = new TaskManager();
    jest.spyOn(mng, 'add').mockImplementation();

    const task = git.command('cmd', ['arg1', 'arg2'], { manager: mng });
    expect(mng.add).toHaveBeenCalledWith(task);

    expect(task.cmd).toBe('git');
    expect(task.args).toEqual(['cmd', 'arg1', 'arg2']);
  });
});

for (const cmd of ['branch', 'diff', 'tag'] as GitCommand[]) {
  describe(`git.${cmd}`, () => {
    let task: SpawnTask;

    beforeEach(() => {
      task = new TestSpawnTask('git', [cmd]);

      jest.spyOn(git, 'command')
        .mockReturnValue(task);
    });

    // Tests
    it(`should call command with ${cmd}`, () => {
      expect(git[cmd](['arg1', 'arg2']))
        .toBe(task);

      expect(git.command)
        .toHaveBeenCalledWith(cmd, ['arg1', 'arg2'], undefined);
    });
  });
}

describe('git.listBranches', () => {
  let task: SpawnTask;

  beforeEach(() => {
    task = new TestSpawnTask('git');

    jest.spyOn(git, 'command')
      .mockReturnValue(task);

    jest.spyOn(task, 'stdout')
      .mockImplementation(async function* () { yield 'dev'; yield 'master'; });
  });

  // Tests
  it('should call git branch -l', async () => {
    await expect(git.listBranches(['arg1', 'arg2']))
      .resolves.toEqual(['dev', 'master']);

    expect(git.command)
      .toHaveBeenCalledWith('branch', ['-l', 'arg1', 'arg2'], undefined);
  });
});

describe('git.listTags', () => {
  let task: SpawnTask;

  beforeEach(() => {
    task = new TestSpawnTask('git');

    jest.spyOn(git, 'command')
      .mockReturnValue(task);

    jest.spyOn(task, 'stdout')
      .mockImplementation(async function* () { yield '1.0.0'; yield '2.0.0'; });
  });

  // Tests
  it('should call git tag -l', async () => {
    await expect(git.listTags(['arg1', 'arg2']))
      .resolves.toEqual(['1.0.0', '2.0.0']);

    expect(git.command)
      .toHaveBeenCalledWith('tag', ['-l', 'arg1', 'arg2'], undefined);
  });
});