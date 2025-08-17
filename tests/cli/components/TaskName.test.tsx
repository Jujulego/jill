import TaskName from '@/src/cli/components/TaskName.jsx';
import { ScriptTask } from '@/src/tasks/script-task.js';
import { TestBed } from '@/tools/test-bed.js';
import { SpawnTask } from '@jujulego/tasks';
import { Text } from 'ink';
import { cleanup, render } from 'ink-testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Setup
let bed: TestBed;

beforeEach(() => {
  bed = new TestBed();
});

afterEach(() => {
  cleanup();
});

// Tests
describe('<TaskName>', () => {
  it('should print task\'s name', () => {
    const task = new SpawnTask('cmd', [], {});
    vi.spyOn(task, 'name', 'get').mockReturnValue('test');
    
    const { lastFrame } = render(
      <Text>
        <TaskName task={task} />
      </Text>
    );
    
    expect(lastFrame()).toBe('test');
  });

  it('should print running script', () => {
    const wks = bed.addWorkspace('wks-a');
    const task = new ScriptTask(wks, 'cmd', []);

    const { lastFrame } = render(
      <Text>
        <TaskName task={task} />
      </Text>
    );

    expect(lastFrame()).toEqual(expect.ignoreColor('Run cmd script'));
  });

  it('should print running script and workspace name', () => {
    const wks = bed.addWorkspace('wks-a');
    const task = new ScriptTask(wks, 'cmd', []);

    const { lastFrame } = render(
      <Text>
        <TaskName task={task} withWorkspace />
      </Text>
    );

    expect(lastFrame()).toEqual(expect.ignoreColor('Run cmd script in wks-a'));
  });
});
