import { Task, TaskManager } from '../src';

// Setup
let manager: TaskManager;

beforeEach(() => {
  manager = new TaskManager();
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
