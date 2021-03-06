import { Task, TaskManager } from '../src';
import { TestTask } from './utils/task';
import './utils/logger';

// Setup
let manager: TaskManager;

beforeEach(() => {
  manager = new TaskManager(1);
});

// Test suites
describe('TaskManager.add', () => {
  // Setup
  const ta = new TestTask('task-a');
  const tb = new TestTask('task-b');
  const tc = new TestTask('task-c');

  ta.dependsOn(tb); // complexity 3
  ta.dependsOn(tc); // complexity 1
  tb.dependsOn(tc); // complexity 0

  // Tests
  it('should add task and it\'s dependencies, then sort by complexity', () => {
    manager.add(ta);
    expect(manager.tasks).toEqual([tc, tb, ta]);
  });
});

describe('TaskManager.start', () => {
  // Setup
  let ta: TestTask;
  let tb: TestTask;
  let tc: TestTask;

  beforeEach(() => {
    ta = new TestTask('task-a');
    tb = new TestTask('task-b');
    tc = new TestTask('task-c');

    ta.dependsOn(tb); // complexity 3
    ta.dependsOn(tc); // complexity 1
    tb.dependsOn(tc); // complexity 0
  });

  // Tests
  it('should start all tasks, one after another', () => {
    jest.spyOn(ta, 'start');
    jest.spyOn(tb, 'start');
    jest.spyOn(tc, 'start');

    const spyStarted = jest.fn<void, [Task]>();
    manager.on('started', spyStarted);

    const spyCompleted = jest.fn<void, [Task]>();
    manager.on('completed', spyCompleted);

    // Start !
    manager.add(ta);

    // First task c should start
    expect(ta.start).not.toHaveBeenCalled();
    expect(tb.start).not.toHaveBeenCalled();
    expect(tc.start).toHaveBeenCalled();

    expect(spyStarted).toHaveBeenCalledWith(tc);

    // When c completes, b should start
    tc._setStatus('done');

    expect(ta.start).not.toHaveBeenCalled();
    expect(tb.start).toHaveBeenCalled();

    expect(spyCompleted).toHaveBeenCalledWith(tc);
    expect(spyStarted).toHaveBeenCalledWith(tb);

    // When b completes, a should start
    tb._setStatus('done');

    expect(ta.start).toHaveBeenCalled();

    expect(spyCompleted).toHaveBeenCalledWith(tb);
    expect(spyStarted).toHaveBeenCalledWith(ta);

    // Finally a completes
    ta._setStatus('done');

    expect(spyCompleted).toHaveBeenCalledWith(ta);
  });
});
