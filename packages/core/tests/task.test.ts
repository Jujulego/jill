import { Task } from '../src';

// Test suites
describe('Task.constructor', () => {
  // Tests
  it('should start with ready status', () => {
    const task = new Task('test', ['arg1', 'arg2']);

    expect(task.status).toBe('ready');
  });

  it('should use current cwd by default', () => {
    const task = new Task('test', ['arg1', 'arg2']);

    expect(task.cwd).toBe(process.cwd());
  });

  it('should use cwd given in options', () => {
    const task = new Task('test', ['arg1', 'arg2'], { cwd: '/test' });

    expect(task.cwd).toBe('/test');
  });
});
