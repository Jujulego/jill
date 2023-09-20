import { SpawnTask } from '@jujulego/tasks';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { vi } from 'vitest';

import { ScriptTask } from '@/src/tasks/script-task.js';
import TaskName from '@/src/ui/task-name.js';

import { TestBed } from '@/tools/test-bed.js';

// Setup
let bed: TestBed;

beforeEach(() => {
  bed = new TestBed();
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

  it('should print running script and workspace name', () => {
    const wks = bed.addWorkspace('wks-a');
    const task = new ScriptTask(wks, 'cmd', []);

    const { lastFrame } = render(
      <Text>
        <TaskName task={task} />
      </Text>
    );

    expect(lastFrame()).toEqual(expect.ignoreColor('Running cmd in wks-a'));
  });
});
