import path from 'path';

import { WatchTask } from '../../src/tasks/watch-task';

// Setup
beforeEach(() => {
  jest.resetAllMocks();
});

// Tests suites
describe('new WatchTask', () => {
  it('should generate id', () => {
    const task = new WatchTask('/project', 'test', ['--arg']);

    expect(task.id).toBe('0cfa710da3cc40387f54615ed9af7d5b');
    expect(task.status).toBe('ready');
    expect(task.cwd).toBe('/project');
    expect(task.cmd).toBe('test');
    expect(task.args).toEqual(['--arg']);
  });
});

describe('WatchTask.toPlain', () => {
  it('should return plain object with task data', () => {
    const task = new WatchTask('/project', 'test', ['--arg']);

    expect(task.toPlain()).toEqual({
      id: '0cfa710da3cc40387f54615ed9af7d5b',
      status: 'ready',
      cwd: path.resolve('/project'),
      cmd: 'test',
      args: ['--arg'],
    });
  });
});