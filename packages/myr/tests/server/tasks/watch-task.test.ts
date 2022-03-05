import { createHash } from 'crypto';
import path from 'path';

import { SpawnTaskMode } from '../../../src/common';
import { WatchTask } from '../../../src/server/tasks/watch-task.model';

// Setup
beforeEach(() => {
  jest.resetAllMocks();
});

// Tests suites
describe('new WatchTask', () => {
  it('should generate id', () => {
    const task = new WatchTask('/project', 'test', ['--arg'], SpawnTaskMode.managed);

    expect(task.id).toBe(
      createHash('md5')
        .update(path.resolve('/project'))
        .update('test')
        .update('--arg')
        .digest('hex')
    );

    expect(task.status).toBe('ready');
    expect(task.cwd).toBe('/project');
    expect(task.cmd).toBe('test');
    expect(task.args).toEqual(['--arg']);

    expect(task.mode).toBe('managed');
    expect(task.watchOn).toEqual([]);
  });
});

describe('WatchTask.watch', () => {
  it('should add task to "watchOn" array', () => {
    const deps = new WatchTask('/project', 'test', [], SpawnTaskMode.auto);
    const task = new WatchTask('/project', 'test', [], SpawnTaskMode.managed);

    // Call
    task.watch(deps);

    expect(task.watchOn).toEqual([deps]);
  });
});
