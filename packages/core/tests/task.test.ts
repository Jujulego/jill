import cp from 'child_process';
import { EventEmitter } from 'events';

import { Task } from '../src';
import './logger';

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
      stdio: 'pipe',
      env: expect.objectContaining({
        FORCE_COLOR: process.env.FORCE_COLOR || '1'
      })
    });

    expect(task.status).toBe('running');
    expect(spyRunning).toHaveBeenCalledTimes(1);

    // Complete process
    proc.emit('close', 0);

    expect(task.status).toBe('done');
    expect(spyDone).toHaveBeenCalledTimes(1);

    // Cannot start again
    expect(() => task.start()).toThrow(expect.any(Error));
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
      stdio: 'pipe',
      env: expect.objectContaining({
        FORCE_COLOR: process.env.FORCE_COLOR || '1'
      })
    });

    expect(task.status).toBe('running');
    expect(spyRunning).toHaveBeenCalledTimes(1);

    // Complete process
    proc.emit('close', 1);

    expect(task.status).toBe('failed');
    expect(spyFailed).toHaveBeenCalledTimes(1);

    // Cannot start again
    expect(() => task.start()).toThrow(expect.any(Error));
  });
});

describe('Task.complexity', () => {
  // Setup
  const ta = new Task('task-a');
  const tb = new Task('task-b');
  const tc = new Task('task-c');

  ta.addDependency(tb);
  ta.addDependency(tc);
  tb.addDependency(tc);

  // Tests
  test('task A should have complexity 3', () => {
    expect(ta.complexity()).toBe(3);
  });

  test('task B should have complexity 1', () => {
    expect(tb.complexity()).toBe(1);
  });

  test('task C should have complexity 0', () => {
    expect(tc.complexity()).toBe(0);
  });
});

// Independent tests
test('Success dependency should set task as ready', async () => {
  // Setup
  const taskA = new Task('test-a');
  const taskB = new Task('test-b');
  taskA.addDependency(taskB);

  const spyA = jest.fn();
  taskA.on('ready', spyA);

  const spyB = jest.fn();
  taskB.on('done', spyB);

  // Complete task B
  const proc = new EventEmitter();

  jest.spyOn(cp, 'spawn')
    .mockReturnValue(proc as cp.ChildProcess);

  taskB.start();
  proc.emit('close', 0);

  // Checks
  expect(taskB.status).toBe('done');
  expect(spyB).toHaveBeenCalledTimes(1);

  expect(taskA.status).toBe('ready');
  expect(spyA).toHaveBeenCalledTimes(1);
});

test('Failed dependency should also set task as failed', async () => {
  // Setup
  const taskA = new Task('test-a');
  const taskB = new Task('test-b');
  taskA.addDependency(taskB);

  const spyA = jest.fn();
  taskA.on('failed', spyA);

  const spyB = jest.fn();
  taskB.on('failed', spyB);

  // Fail task B
  const proc = new EventEmitter();

  jest.spyOn(cp, 'spawn')
    .mockReturnValue(proc as cp.ChildProcess);

  taskB.start();
  proc.emit('close', 1);

  // Checks
  expect(taskB.status).toBe('failed');
  expect(spyB).toHaveBeenCalledTimes(1);

  expect(taskA.status).toBe('failed');
  expect(spyA).toHaveBeenCalledTimes(1);
});

test('Cannot start a waiting task', async () => {
  // Setup
  const taskA = new Task('test-a');
  const taskB = new Task('test-b');
  taskA.addDependency(taskB);

  const spyA = jest.fn();
  taskA.on('failed', spyA);

  const spyB = jest.fn();
  taskB.on('failed', spyB);

  // Cannot start again
  expect(() => taskB.start()).toThrow(expect.any(Error));
});

test('Cannot add a dependency to a running/completed task', async () => {
  // Setup
  const taskA = new Task('test-a');
  const taskB = new Task('test-b');

  // Complete task B
  const proc = new EventEmitter();

  jest.spyOn(cp, 'spawn')
    .mockReturnValue(proc as cp.ChildProcess);

  taskA.start();
  expect(() => taskA.addDependency(taskB)).toThrow(expect.any(Error));

  proc.emit('close', 0);
  expect(() => taskA.addDependency(taskB)).toThrow(expect.any(Error));
});

test('Cannot add a dependency to a failed task', async () => {
  // Setup
  const taskA = new Task('test-a');
  const taskB = new Task('test-b');

  // Complete task B
  const proc = new EventEmitter();

  jest.spyOn(cp, 'spawn')
    .mockReturnValue(proc as cp.ChildProcess);

  taskA.start();
  proc.emit('close', 1);

  expect(() => taskA.addDependency(taskB)).toThrow(expect.any(Error));
});
