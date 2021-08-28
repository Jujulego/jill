import { TaskStatus, Workspace } from '../../src';

import '../logger';
import { TestTask } from './task';

beforeEach(() => {
  jest.resetAllMocks();
});

// Test suites
describe('Task.constructor', () => {
  // Tests
  it('should start with ready status', () => {
    const task = new TestTask('test');

    expect(task.status).toBe('ready');
  });

  it('should store given context', () => {
    const wks = {} as Workspace;
    const task = new TestTask('test', { context: { workspace: wks }});

    expect(task.context).toEqual({
      workspace: wks
    });
  });
});

describe('Task.dependsOn', () => {
  it('should change task state to waiting', () => {
    const taskA = new TestTask('test-a');
    const taskB = new TestTask('test-b');

    const spy = jest.fn();
    taskA.on('waiting', spy);

    // Test
    taskA.dependsOn(taskB);

    expect(taskA.status).toBe('waiting');
    expect(taskA.dependencies).toEqual([taskB]);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  for (const status of ['running', 'done', 'failed'] as TaskStatus[]) {
    it(`should fail if task is ${status}`, () => {
      const taskA = new TestTask('test-a');
      const taskB = new TestTask('test-b');

      // Test
      taskA._setStatus(status);
      expect(() => taskA.dependsOn(taskB)).toThrow(Error(`Cannot add a dependency to a ${status} task`));
      expect(taskA.status).toEqual(status);
      expect(taskA.dependencies).toEqual([]);
    });
  }
});

describe('Task.start', () => {
  it('should set task status to running and call _start method', () => {
    const task = new TestTask('test');
    jest.spyOn(task, '_start').mockImplementation();

    const spyRunning = jest.fn();
    task.on('running', spyRunning);

    // Start task
    task.start();
    expect(task.status).toBe('running');
    expect(task._start).toHaveBeenCalledTimes(1);
    expect(spyRunning).toHaveBeenCalledTimes(1);
  });

  for (const status of ['waiting', 'running', 'done', 'failed'] as TaskStatus[]) {
    it(`should fail if task is ${status}`, () => {
      const task = new TestTask('test');
      task._setStatus(status);
      jest.spyOn(task, '_start').mockImplementation();

      // Start task
      expect(() => task.start()).toThrow(Error(`Cannot start a ${status} task`));
      expect(task.status).toBe(status);
      expect(task._start).not.toHaveBeenCalled();
    });
  }
});

describe('Task.stop', () => {
  it('should call _stop method', () => {
    const task = new TestTask('test');
    task._setStatus('running');
    jest.spyOn(task, '_stop').mockImplementation();

    // Start task
    task.stop();
    expect(task.status).toBe('running');
    expect(task._stop).toHaveBeenCalledTimes(1);
  });

  for (const status of ['waiting', 'ready', 'done', 'failed'] as TaskStatus[]) {
    it(`should do nothing if task is ${status}`, () => {
      const task = new TestTask('test');
      task._setStatus(status);
      jest.spyOn(task, '_stop').mockImplementation();

      // Start task
      task.stop();
      expect(task.status).toBe(status);
      expect(task._stop).not.toHaveBeenCalled();
    });
  }
});

describe('Task.complexity', () => {
  // Setup
  const ta = new TestTask('task-a');
  const tb = new TestTask('task-b');
  const tc = new TestTask('task-c');

  ta.dependsOn(tb);
  ta.dependsOn(tc);
  tb.dependsOn(tc);

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

describe('Task.completed', () => {
  // Tests
  for (const status of ['done', 'failed'] as TaskStatus[]) {
    it(`should be true if task is ${status}`, () => {
      const tsk = new TestTask('test');
      tsk._setStatus(status);

      expect(tsk.completed).toBe(true);
    });
  }

  for (const status of ['waiting', 'ready', 'running'] as TaskStatus[]) {
    it(`should be false if task is ${status}`, () => {
      const tsk = new TestTask('test');
      tsk._setStatus(status);

      expect(tsk.completed).toBe(false);
    });
  }
});

// Independent tests
test('Successful dependency should mark task ready', async () => {
  // Setup
  const taskA = new TestTask('test-a');
  const taskB = new TestTask('test-b');
  taskA.dependsOn(taskB);

  const spyA = jest.fn();
  taskA.on('ready', spyA);

  const spyB = jest.fn();
  taskB.on('done', spyB);

  // Complete task B
  taskB._setStatus('done');

  expect(taskB.status).toBe('done');
  expect(spyB).toHaveBeenCalledTimes(1);

  expect(taskA.status).toBe('ready');
  expect(spyA).toHaveBeenCalledTimes(1);
});

// Independant tests
test('Failed dependency should also mark task failed', async () => {
  // Setup
  const taskA = new TestTask('test-a');
  const taskB = new TestTask('test-b');
  taskA.dependsOn(taskB);

  const spyA = jest.fn();
  taskA.on('failed', spyA);

  const spyB = jest.fn();
  taskB.on('failed', spyB);

  // Fail task B
  taskB._setStatus('failed');

  // Checks
  expect(taskB.status).toBe('failed');
  expect(spyB).toHaveBeenCalledTimes(1);

  expect(taskA.status).toBe('failed');
  expect(spyA).toHaveBeenCalledTimes(1);
});
