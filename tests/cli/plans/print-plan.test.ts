import { buildPlan } from '@/src/cli/plans/build-plan.js';
import { printPlan } from '@/src/cli/plans/print-plan.js';
import { job$, workflow$, workload$ } from '@jujulego/tasks';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mocks
let stream: NodeJS.WriteStream;
let screen = '';

vi.mock('@/src/cli/plans/build-plan.js');

beforeEach(() => {
  vi.resetAllMocks();

  stream = {
    isTTY: true,
    write: vi.fn() as NodeJS.WriteStream['write'],
  } as NodeJS.WriteStream;

  screen = '';
  vi.mocked(stream.write).mockImplementation((chunk) => {
    screen += chunk as string;
    return true;
  });
});

// Tests
describe('printPlan', () => {
  it('should print simple plan', () => {
    const wkl = workload$({ label: 'test', type: 'test', onStart: vi.fn() });

    vi.mocked(buildPlan).mockReturnValue([
      { id: 1, branch: '', dependsOn: [], level: 0, workload: wkl }
    ]);

    printPlan(wkl, stream);
    expect(screen).toMatchSnapshot();

    expect(buildPlan).toHaveBeenCalledWith(wkl);
  });

  it('should print plan with dependencies', () => {
    const dep = workload$({ label: 'dep', type: 'test', onStart: vi.fn() });

    const job = job$({ label: 'job', onStart: vi.fn() });
    job.dependsOn(dep);

    vi.mocked(buildPlan).mockReturnValue([
      { id: 1, branch: '', dependsOn: [], level: 0, workload: dep },
      { id: 2, branch: '', dependsOn: [1], level: 0, workload: job }
    ]);

    printPlan(job, stream);
    expect(screen).toMatchSnapshot();

    expect(buildPlan).toHaveBeenCalledWith(job);
  });

  it('should print plan with workflow members', () => {
    const wklA = workload$({ label: 'A', type: 'test', onStart: vi.fn() });
    const wklB = workload$({ label: 'B', type: 'test', onStart: vi.fn() });

    const flow = workflow$({ label: 'test', onOrchestrate: vi.fn() });
    flow.push(wklA, wklB);

    vi.mocked(buildPlan).mockReturnValue([
      { id: 1, branch: '', dependsOn: [], level: 0, workload: flow },
      { id: 2, branch: '├─ ', dependsOn: [], level: 1, workload: wklA },
      { id: 3, branch: '└─ ', dependsOn: [], level: 1, workload: wklB },
    ]);

    printPlan(flow, stream);
    expect(screen).toMatchSnapshot();

    expect(buildPlan).toHaveBeenCalledWith(flow);
  });
});
