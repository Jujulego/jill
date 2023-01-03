import { SpawnTask } from '@jujulego/tasks';
import { render } from 'ink-testing-library';

import TaskName from '@/src/ui/task-name';
import { TestBed } from '@/tools/test-bed';

// Setup
let bed: TestBed;

beforeEach(() => {
  bed = new TestBed();
});

// Tests
describe('<TaskName>', () => {
  it('should print task\'s name', () => {
    const task = new SpawnTask('cmd', [], {});
    jest.spyOn(task, 'name', 'get').mockReturnValue('test');
    
    const { lastFrame } = render(<TaskName task={task} />);
    
    expect(lastFrame()).toBe('test');
  });

  it('should print running script and workspace name', () => {
    const wks = bed.addWorkspace('wks-a');
    const task = new SpawnTask('cmd', [], {
      script: 'test',
      workspace: wks,
    });

    const { lastFrame } = render(<TaskName task={task} />);

    expect(lastFrame()).toBe('Running test in wks-a');
  });
});
