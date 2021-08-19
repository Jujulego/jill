import { EventEmitter } from 'events';
import cp from 'child_process';

import { Task, TaskManager } from '../src';
import './logger';

// Setup
let manager: TaskManager;

beforeEach(() => {
  manager = new TaskManager(1);
});

// Test suites
describe('TaskManager.add', () => {
  // Setup
  const ta = new Task('task-a');
  const tb = new Task('task-b');
  const tc = new Task('task-c');

  ta.addDependency(tb); // complexity 3
  ta.addDependency(tc); // complexity 1
  tb.addDependency(tc); // complexity 0

  // Tests
  it('should add task and it\'s dependencies, then sort by complexity', () => {
    manager.add(ta);
    expect(manager.tasks).toEqual([tc, tb, ta]);
  });
});

describe('TaskManager.start', () => {
  // Setup
  const ta = new Task('task-a');
  const tb = new Task('task-b');
  const tc = new Task('task-c');

  ta.addDependency(tb); // complexity 3
  ta.addDependency(tc); // complexity 1
  tb.addDependency(tc); // complexity 0

  // Tests
  it('should start all tasks, one after another', () => {
    jest.spyOn(ta, 'start');
    jest.spyOn(tb, 'start');
    jest.spyOn(tc, 'start');

    const proc = new EventEmitter();

    jest.spyOn(cp, 'spawn')
      .mockReturnValue(proc as cp.ChildProcess);

    const spyStarted = jest.fn<void, [Task]>();
    manager.on('started', spyStarted);

    const spyCompleted = jest.fn<void, [Task]>();
    manager.on('completed', spyCompleted);

    const spyFinished = jest.fn<void, []>();
    manager.on('finished', spyFinished);

    // Start !
    manager.add(ta);
    manager.start();

    // First task c should start
    expect(ta.start).not.toHaveBeenCalled();
    expect(tb.start).not.toHaveBeenCalled();
    expect(tc.start).toHaveBeenCalled();

    expect(spyStarted).toHaveBeenCalledWith(tc);

    // When c completes b should start
    proc.emit('close', 0);

    expect(ta.start).not.toHaveBeenCalled();
    expect(tb.start).toHaveBeenCalled();

    expect(spyCompleted).toHaveBeenCalledWith(tc);
    expect(spyStarted).toHaveBeenCalledWith(tb);

    // When b completes a should start
    proc.emit('close', 0);

    expect(ta.start).toHaveBeenCalled();

    expect(spyCompleted).toHaveBeenCalledWith(tb);
    expect(spyStarted).toHaveBeenCalledWith(ta);
    expect(spyFinished).not.toHaveBeenCalled();

    // When b completes a should start
    proc.emit('close', 0);

    expect(spyCompleted).toHaveBeenCalledWith(ta);
    expect(spyFinished).toHaveBeenCalled();
  });
});
