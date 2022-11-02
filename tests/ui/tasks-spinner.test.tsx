import { SpawnTask, TaskManager } from '@jujulego/tasks';
import { render, cleanup } from 'ink-testing-library';

import { TasksSpinner } from '../../src/ui';
import { spyLogger } from '../utils';

// Setup
let taskA: SpawnTask;
let taskB: SpawnTask;
let taskC: SpawnTask;

beforeEach(() => {
  taskA = new SpawnTask('cmd-a', [], {}, { logger: spyLogger });
  taskB = new SpawnTask('cmd-b', [], {}, { logger: spyLogger });
  taskC = new SpawnTask('cmd-c', [], {}, { logger: spyLogger });
});

afterEach(() => {
  cleanup();
});

// Tests
describe('<TasksSpinner>', () => {
  it('should print every managed tasks', () => {
    const manager = new TaskManager({ jobs: 0, logger: spyLogger });
    manager.add(taskA);
    manager.add(taskB);

    const { lastFrame } = render(<TasksSpinner manager={manager} />);

    expect(lastFrame()).toMatchSnapshot();
  });

  it('should print added tasks while running', async () => {
    const manager = new TaskManager({ jobs: 0, logger: spyLogger });
    manager.add(taskA);
    manager.add(taskB);

    const { lastFrame } = render(<TasksSpinner manager={manager} />);

    manager.add(taskC);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(lastFrame()).toMatchSnapshot();
  });
});
