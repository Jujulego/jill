import { Project, Workspace } from '@jujulego/jill-core';
import chalk from 'chalk';
import { render, cleanup } from 'ink-testing-library';

import { TaskSpinner } from '../../src/components/TaskSpinner';

import '../logger';
import { pkg } from '../utils/package';
import { TestTask } from '../utils/task';
import logSymbols from 'log-symbols';

// Setup
chalk.level = 1;

let tsk: TestTask;
let wks: Workspace;

beforeEach(() => {
  tsk = new TestTask('test');
  wks = new Workspace('wks', pkg({ name: 'wks' }), new Project('/'));
});

afterEach(() => {
  cleanup();
});

// Tests
describe('TaskSpinner', () => {
  it('should follow task\'s status', async () => {
    expect(tsk.listenerCount('status')).toBe(0);

    // First render
    const { lastFrame, rerender, unmount } = render(<TaskSpinner task={tsk} />);
    await new Promise(res => setTimeout(res, 0));

    expect(lastFrame()).toBe('.   test is ready');
    expect(tsk.listenerCount('status')).toBe(1);

    // Update state
    tsk._setStatus('running');
    rerender(<TaskSpinner task={tsk} />);

    expect(lastFrame()).toBe('- test is running');

    // Unmount
    unmount();
    await new Promise(res => setTimeout(res, 0));

    expect(tsk.listenerCount('status')).toBe(0);
  });

  it('should print blocked task', () => {
    // Render
    tsk._setStatus('blocked');
    const { lastFrame } = render(<TaskSpinner task={tsk} />);

    expect(lastFrame()).toBe('.   test is blocked');
  });

  it('should print ready task', () => {
    // Render
    tsk._setStatus('ready');
    const { lastFrame } = render(<TaskSpinner task={tsk} />);

    expect(lastFrame()).toBe('.   test is ready');
  });

  it('should print running task', () => {
    // Render
    tsk._setStatus('running');
    const { lastFrame } = render(<TaskSpinner task={tsk} />);

    expect(lastFrame()).toBe('- test is running');
  });

  it('should print done task', () => {
    // Render
    tsk._setStatus('done');
    const { lastFrame } = render(<TaskSpinner task={tsk} />);

    expect(lastFrame()).toBe(`${logSymbols.success} test is done`);
  });

  it('should print failed task', () => {
    // Render
    tsk._setStatus('failed');
    const { lastFrame } = render(<TaskSpinner task={tsk} />);

    expect(lastFrame()).toBe(`${logSymbols.error} test is failed`);
  });

  it('should print blocked workspace task', () => {
    // Render
    tsk._setStatus('blocked');
    tsk._setContext({ workspace: wks });
    const { lastFrame } = render(<TaskSpinner task={tsk} />);

    expect(lastFrame()).toBe(chalk`.   {grey [wks]} test is blocked`);
  });

  it('should print ready workspace task', () => {
    // Render
    tsk._setStatus('ready');
    tsk._setContext({ workspace: wks });
    const { lastFrame } = render(<TaskSpinner task={tsk} />);

    expect(lastFrame()).toBe(chalk`.   {grey [wks]} test is ready`);
  });

  it('should print running workspace task', () => {
    // Render
    tsk._setStatus('running');
    tsk._setContext({ workspace: wks });
    const { lastFrame } = render(<TaskSpinner task={tsk} />);

    expect(lastFrame()).toBe(chalk`- {grey [wks]} test is running`);
  });

  it('should print done workspace task', () => {
    // Render
    tsk._setStatus('done');
    tsk._setContext({ workspace: wks });
    const { lastFrame } = render(<TaskSpinner task={tsk} />);

    expect(lastFrame()).toBe(chalk`${logSymbols.success} {grey [wks]} test is done`);
  });

  it('should print failed workspace task', () => {
    // Render
    tsk._setStatus('failed');
    tsk._setContext({ workspace: wks });
    const { lastFrame } = render(<TaskSpinner task={tsk} />);

    expect(lastFrame()).toBe(chalk`${logSymbols.error} {grey [wks]} test is failed`);
  });
});
