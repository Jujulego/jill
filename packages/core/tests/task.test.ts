import cp from 'child_process';
import { EventEmitter } from 'events';

import { Task } from '../src';

beforeEach(() => {
  jest.resetAllMocks();
});

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

describe('Task.addDependency', () => {
  it('should change task state to waiting', () => {
    const taskA = new Task('test-a');
    const taskB = new Task('test-b');

    const spy = jest.fn();
    taskA.on('waiting', spy);

    taskA.addDependency(taskB);

    expect(taskA.status).toBe('waiting');
    expect(taskA.dependencies).toEqual([taskB]);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('Task.start', () => {
  it('should set task status to done when process complete successfully', () => {
    const task = new Task('test', ['arg1', 'arg2'], { cwd: '/test' });
    const proc = new EventEmitter();

    jest.spyOn(cp, 'spawn')
      .mockReturnValue(proc as cp.ChildProcess);

    const spyRunning = jest.fn();
    const spyDone = jest.fn();

    task.on('running', spyRunning);
    task.on('done', spyDone);

    // Start task
    task.start();

    expect(cp.spawn).toHaveBeenCalledTimes(1);
    expect(cp.spawn).toHaveBeenCalledWith('test', ['arg1', 'arg2'], {
      cwd: '/test',
      shell: true,
      stdio: 'inherit',
      env: expect.objectContaining({
        FORCE_COLOR: '1'
      })
    });

    expect(task.status).toBe('running');
    expect(spyRunning).toHaveBeenCalledTimes(1);

    // Complete process
    proc.emit('close', 0);

    expect(task.status).toBe('done');
    expect(spyDone).toHaveBeenCalledTimes(1);
  });

  it('should set task status to failed when process failed', () => {
    const task = new Task('test', ['arg1', 'arg2'], { cwd: '/test' });
    const proc = new EventEmitter();

    jest.spyOn(cp, 'spawn')
      .mockReturnValue(proc as cp.ChildProcess);

    const spyRunning = jest.fn();
    const spyFailed = jest.fn();

    task.on('running', spyRunning);
    task.on('failed', spyFailed);

    // Start task
    task.start();

    expect(cp.spawn).toHaveBeenCalledTimes(1);
    expect(cp.spawn).toHaveBeenCalledWith('test', ['arg1', 'arg2'], {
      cwd: '/test',
      shell: true,
      stdio: 'inherit',
      env: expect.objectContaining({
        FORCE_COLOR: '1'
      })
    });

    expect(task.status).toBe('running');
    expect(spyRunning).toHaveBeenCalledTimes(1);

    // Complete process
    proc.emit('close', 1);

    expect(task.status).toBe('failed');
    expect(spyFailed).toHaveBeenCalledTimes(1);
  });
});
