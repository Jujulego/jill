import { render, cleanup } from 'ink-testing-library';
import symbols from 'log-symbols';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import TaskSpinner from '@/src/ui/task-spinner.js';

import { TestSpawnTask } from '@/tools/test-tasks.js';
import { noColor } from '@/tools/utils.js';

// Setup
let task: TestSpawnTask;

beforeEach(() => {
  task = new TestSpawnTask('cmd', [], {});
});

afterEach(() => {
  cleanup();
});

// Tests
describe('<TaskSpinner>', () => {
  it('should print task name preceded by a spinner', () => {
    const { lastFrame } = render(<TaskSpinner task={task} />);

    // eslint-disable-next-line quotes
    expect(noColor(lastFrame())).toMatchInlineSnapshot(`"\u00B7 cmd"`);
  });

  it('should print task name with running spinner', () => {
    const { lastFrame } = render(<TaskSpinner task={task} />);

    vi.spyOn(task, 'status', 'get').mockReturnValue('running');
    task.emit('status.running', { status: 'running', previous: 'ready' });

    // eslint-disable-next-line quotes
    expect(noColor(lastFrame())).toMatchInlineSnapshot(`"⠋ cmd"`);
  });

  it('should print task name with success symbol', () => {
    const { lastFrame } = render(<TaskSpinner task={task} />);

    vi.spyOn(task, 'status', 'get').mockReturnValue('done');
    task.emit('status.done', { status: 'done', previous: 'running' });
    task.emit('completed', { status: 'done', duration: 100 });

    expect(lastFrame()).toEqual(expect.ignoreColor(`${symbols.success} cmd (took 100ms)`));
  });

  it('should print task name with error symbol', () => {
    const { lastFrame } = render(<TaskSpinner task={task} />);

    vi.spyOn(task, 'status', 'get').mockReturnValue('failed');
    task.emit('status.failed', { status: 'failed', previous: 'running' });
    task.emit('completed', { status: 'failed', duration: 100 });

    expect(lastFrame()).toEqual(expect.ignoreColor(`${symbols.error} cmd (took 100ms)`));
  });
});
