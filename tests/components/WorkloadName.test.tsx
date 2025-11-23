import { WorkloadName } from '@/src/components/WorkloadName.jsx';
import { type ScriptWorkflow$ } from '@/src/jobs/run-script$.js';
import type { Workspace } from '@/src/projects/workspace.js';
import { TestBed } from '@/tools/test-bed.js';
import { spawn$, workload$ } from '@kyrielle/workload';
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
describe('<WorkloadName>', () => {
  it('should print workload\'s name capitalized', () => {
    const workload = workload$({ label: 'test', type: 'test', onStart: vi.fn() });

    const { lastFrame } = render(<WorkloadName workload={workload} />);
    
    expect(lastFrame()).toBe('Test');
  });

  it('should print spawned command', () => {
    const workload = spawn$('test -a');

    const { lastFrame } = render(<WorkloadName workload={workload} />);

    expect(lastFrame()).toBe('test -a');
  });

  it('should print script\'s name', () => {
    const workspace = bed.addWorkspace('wks-a') as Workspace;
    const workload = { script: 'test', type: 'script', workspace } as ScriptWorkflow$;

    const { lastFrame } = render(<WorkloadName workload={workload} />);

    expect(lastFrame()).toEqual(expect.ignoreColor('Run test script'));
  });

  it('should print script\'s and workspace\'s names', () => {
    const workspace = bed.addWorkspace('wks-a') as Workspace;
    const workload = { script: 'test', type: 'script', workspace } as ScriptWorkflow$;

    const { lastFrame } = render(<WorkloadName workload={workload} withWorkspace />);

    expect(lastFrame()).toEqual(expect.ignoreColor('Run test script in wks-a'));
  });
});
