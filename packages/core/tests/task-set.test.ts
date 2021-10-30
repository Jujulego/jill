import { TaskManager, TaskSet } from '../src';
import { TestTask } from './utils/task';
import './utils/logger';

// Setup
let ta: TestTask;
let tb: TestTask;
let tc: TestTask;

beforeEach(() => {
  ta = new TestTask('task-a');
  tb = new TestTask('task-b');
  tc = new TestTask('task-c');

  ta.dependsOn(tb);
  ta.dependsOn(tc);
  tb.dependsOn(tc);
});

// Test suites
describe('new TaskSet', () => {
  // Tests
  it('should use TaskManager.global by default', () => {
    const set = new TaskSet();

    expect(set.manager).toBe(TaskManager.global);
    expect(set.status).toBe('created');
    expect(set.results).toEqual({
      success: 0,
      failed: 0
    });
  });
});

describe('TaskSet.add', () => {
  // Tests
  it('should add task and it\'s dependencies', () => {
    const set = new TaskSet();
    set.add(ta);

    expect(set.tasks).toEqual([ta, tb, tc]);
  });

  it('should pass task started event', () => {
    const set = new TaskSet();
    const spyStarted = jest.fn();

    set.add(ta);
    set.on('started', spyStarted);

    ta.emit('running');
    expect(spyStarted).toHaveBeenCalledWith(ta);
  });

  it('should pass task done & failed event', () => {
    const set = new TaskSet();
    const spyCompleted = jest.fn();
    const spyFinished = jest.fn();

    set.add(ta);
    set.on('completed', spyCompleted);
    set.on('finished', spyFinished);

    // Send done
    ta.emit('done');
    expect(spyCompleted).toHaveBeenCalledWith(ta);
    expect(spyFinished).not.toHaveBeenCalled();

    // Send failed
    spyCompleted.mockReset();

    ta.emit('failed');
    expect(spyCompleted).toHaveBeenCalledWith(ta);
    expect(spyFinished).not.toHaveBeenCalled();
  });

  it('should emit finished when all tasks are finished', () => {
    const set = new TaskSet();
    const spyFinished = jest.fn();

    set.add(ta);
    set.on('finished', spyFinished);

    // Send done
    tc.emit('done');
    tb.emit('done');
    ta.emit('failed');

    expect(spyFinished).toHaveBeenCalledWith({
      success: 2,
      failed: 1
    });
    expect(set.status).toBe('finished');
  });

  it('should throw if set already started', () => {
    const set = new TaskSet();
    (set as any)._status = 'started';

    expect(() => set.add(ta)).toThrow('Cannot add a task to a started task set');
  });

  it('should throw if set already finished', () => {
    const set = new TaskSet();
    (set as any)._status = 'finished';

    expect(() => set.add(ta)).toThrow('Cannot add a task to a finished task set');
  });
});

describe('TaskSet.start', () => {
  // Tests
  it('should add tasks to the task manager', () => {
    jest.spyOn(TaskManager.global, 'add').mockImplementation();

    const set = new TaskSet();
    set.add(ta);
    set.start();

    expect(set.status).toBe('started');
    expect(TaskManager.global.add).toHaveBeenCalledWith(ta);
    expect(TaskManager.global.add).toHaveBeenCalledWith(tb);
    expect(TaskManager.global.add).toHaveBeenCalledWith(tc);
  });

  it('should finish if task set is empty', () => {
    jest.spyOn(TaskManager.global, 'add').mockImplementation();
    const spyFinished = jest.fn();

    const set = new TaskSet();
    set.on('finished', spyFinished);
    set.start();

    expect(set.status).toBe('finished');
    expect(spyFinished).toHaveBeenCalledWith({
      success: 0,
      failed: 0,
    });
  });

  it('should throw if set already started', () => {
    const set = new TaskSet();
    set.add(ta);
    (set as any)._status = 'started';

    expect(() => set.start()).toThrow('Cannot start a started task set');
  });

  it('should throw if set already finished', () => {
    const set = new TaskSet();
    set.add(ta);
    (set as any)._status = 'finished';

    expect(() => set.start()).toThrow('Cannot start a finished task set');
  });
});