import TaskSpinner from '@/src/cli/components/TaskSpinner.jsx';
import { noColor } from '@/tools/utils.js';
import { SpawnTask } from '@jujulego/tasks';
import { cleanup, render } from 'ink-testing-library';
import symbols from 'log-symbols';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Setup
let task: SpawnTask;

beforeEach(() => {
  task = new SpawnTask('cmd', [], {});
});

afterEach(() => {
  cleanup();
});

// Tests
describe('<TaskSpinner>', () => {
  it('should print task name preceded by a spinner', () => {
    const { lastFrame } = render(<TaskSpinner task={task} />);

    expect(noColor(lastFrame())).toBe('\u00B7 cmd');
  });

  it('should print task name with running spinner', async () => {
    const { lastFrame } = render(<TaskSpinner task={task} />);

    vi.spyOn(task, 'status', 'get').mockReturnValue('running');
    task.events$.emit('status.running', { status: 'running', previous: 'ready' });

    await vi.waitFor(() => {
      expect(noColor(lastFrame())).toBe('⠋ cmd');
    });
  });

  it('should print task name with success symbol',async () => {
    const { lastFrame } = render(<TaskSpinner task={task} />);

    vi.spyOn(task, 'status', 'get').mockReturnValue('done');
    task.events$.emit('status.done', { status: 'done', previous: 'running' });
    task.events$.emit('completed', { status: 'done', duration: 100 });

    await vi.waitFor(() => {
      expect(lastFrame()).toEqual(expect.ignoreColor(`${symbols.success} cmd (took 100ms)`));
    });
  });

  it('should print task name with error symbol', async () => {
    const { lastFrame } = render(<TaskSpinner task={task} />);

    vi.spyOn(task, 'status', 'get').mockReturnValue('failed');
    task.events$.emit('status.failed', { status: 'failed', previous: 'running' });
    task.events$.emit('completed', { status: 'failed', duration: 100 });

    await vi.waitFor(() => {
      expect(lastFrame()).toEqual(expect.ignoreColor(`${symbols.error} cmd (took 100ms)`));
    });
  });
});
