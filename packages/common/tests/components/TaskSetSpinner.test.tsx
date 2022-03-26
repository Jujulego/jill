import { TaskSet } from '@jujulego/jill-core';
import chalk from 'chalk';
import { Text } from 'ink';
import { render, cleanup } from 'ink-testing-library';
import { ReactElement } from 'react';

import { TaskSetSpinner, TaskSpinnerProps } from '../../src';

import '../logger';
import { TestTask } from '../utils/task';

// Mocks
jest.mock('../../src/components/TaskSpinner', () => ({
  TaskSpinner: jest.fn<ReactElement, [TaskSpinnerProps]>().mockImplementation(({ task }) => (
    <Text>&lt;TaskSpinner { task.name } /&gt;</Text>
  ))
}));

// Setup
chalk.level = 1;

let tsk1: TestTask;
let tsk2: TestTask;
let set: TaskSet;

beforeEach(() => {
  tsk1 = new TestTask('test 1');
  tsk2 = new TestTask('test 2');

  set = new TaskSet();
  set.add(tsk1);
  set.add(tsk2);
});

afterEach(() => {
  cleanup();
});

// Tests
describe('TaskSetSpinner', () => {
  it('should show spinner for each running or completed task', async () => {
    expect(set.listenerCount('started')).toBe(0);

    // First task
    const { lastFrame, unmount } = render(<TaskSetSpinner taskSet={set} />);
    await new Promise(res => setTimeout(res, 0));
    tsk1.emit('running');

    expect(lastFrame()).toBe('<TaskSpinner test 1 />');
    expect(set.listenerCount('started')).toBe(1);

    // Second task
    tsk2.emit('running');

    expect(lastFrame()).toBe(
      '<TaskSpinner test 1 />\n' +
      '<TaskSpinner test 2 />'
    );

    // Complete first task
    tsk2.emit('done');

    expect(lastFrame()).toBe(
      '<TaskSpinner test 1 />\n' +
      '<TaskSpinner test 2 />'
    );

    // Unmount
    unmount();
    await new Promise(res => setTimeout(res, 0));

    expect(set.listenerCount('started')).toBe(0);
  });
});
