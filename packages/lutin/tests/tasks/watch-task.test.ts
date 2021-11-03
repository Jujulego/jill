import { createHash } from 'crypto';
import path from 'path';

import { WatchTask } from '../../src/tasks/watch-task';

// Setup
const mockId = createHash('md5')
  .update(path.resolve('/project'))
  .update('test')
  .update('--arg')
  .digest('hex');

beforeEach(() => {
  jest.resetAllMocks();
});

// Tests suites
describe('new WatchTask', () => {
  it('should generate id', () => {
    const task = new WatchTask('/project', 'test', ['--arg']);

    expect(task.id).toBe(mockId);
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
      id: mockId,
      status: 'ready',
      cwd: path.resolve('/project'),
      cmd: 'test',
      args: ['--arg'],
    });
  });
});