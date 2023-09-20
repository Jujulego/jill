import { ParallelGroup, SpawnTask } from '@jujulego/tasks';
import { render, cleanup } from 'ink-testing-library';
import symbols from 'log-symbols';
import { vi } from 'vitest';

import GroupTaskSpinner from '@/src/ui/group-task-spinner.js';
import { flushPromises, spyLogger } from '@/tools/utils.js';

// Setup
let taskA: SpawnTask;
let taskB: SpawnTask;
let taskC: SpawnTask;

let group: ParallelGroup;

beforeEach(() => {
  taskA = new SpawnTask('cmd-a', [], {}, { logger: spyLogger });
  taskB = new SpawnTask('cmd-b', [], {}, { logger: spyLogger });
  taskC = new SpawnTask('cmd-c', [], {}, { logger: spyLogger });

  vi.spyOn(taskA, 'status', 'get').mockReturnValue('done');
  vi.spyOn(taskB, 'status', 'get').mockReturnValue('done');
  vi.spyOn(taskC, 'status', 'get').mockReturnValue('done');

  group = new ParallelGroup('Test group', {}, { logger: spyLogger });
  group.add(taskA);
  group.add(taskB);

  vi.spyOn(group, 'status', 'get').mockReturnValue('done');
});

afterEach(() => {
  cleanup();
});

// Tests
describe('<GroupTaskSpinner>', () => {
  it('should print group and it\'s dependencies', async () => {
    const { lastFrame } = render(<GroupTaskSpinner group={group} />);

    expect(lastFrame()).toEqualLines([
      expect.ignoreColor(`${symbols.success} Test group (took 0ms)`),
      expect.ignoreColor(`  ${symbols.success} cmd-a (took 0ms)`),
      expect.ignoreColor(`  ${symbols.success} cmd-b (took 0ms)`),
    ]);

    // Latter added dependency
    group.add(taskC);
    await flushPromises();

    expect(lastFrame()).toEqualLines([
      expect.ignoreColor(`${symbols.success} Test group (took 0ms)`),
      expect.ignoreColor(`  ${symbols.success} cmd-a (took 0ms)`),
      expect.ignoreColor(`  ${symbols.success} cmd-b (took 0ms)`),
      expect.ignoreColor(`  ${symbols.success} cmd-c (took 0ms)`),
    ]);
  });

  it('should print group children', () => {
    // Add a "root" group
    const root = new ParallelGroup('Root', {});
    root.add(group);
    root.add(taskC);

    vi.spyOn(root, 'status', 'get').mockReturnValue('done');

    const { lastFrame } = render(<GroupTaskSpinner group={root} />);

    expect(lastFrame()).toEqualLines([
      expect.ignoreColor(`${symbols.success} Root (took 0ms)`),
      expect.ignoreColor(`  ${symbols.success} Test group (took 0ms)`),
      expect.ignoreColor(`    ${symbols.success} cmd-a (took 0ms)`),
      expect.ignoreColor(`    ${symbols.success} cmd-b (took 0ms)`),
      expect.ignoreColor(`  ${symbols.success} cmd-c (took 0ms)`),
    ]);
  });
});
