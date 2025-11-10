import { buildPlan } from '@/src/cli/plans/build-plan.js';
import { buildFlatTree } from '@/src/cli/utils/flat-tree.js';
import { job$, workflow$, workload$ } from '@jujulego/tasks';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mocks
vi.mock('@/src/cli/utils/flat-tree.js');

beforeEach(() => {
  vi.resetAllMocks();
});

// Tests
describe('buildPlan', () => {
  it('should return plan with only given workload', () => {
    const wkl = workload$({ label: 'test', type: 'test', onStart: vi.fn() });

    vi.mocked(buildFlatTree).mockReturnValue([
      { level: 0, workload: wkl }
    ]);

    expect(buildPlan(wkl)).toEqual([
      { id: 1, branch: '', dependsOn: [], level: 0, workload: wkl }
    ]);

    expect(buildFlatTree).toHaveBeenCalledWith(wkl, true);
  });

  it('should return plan with given job and its dependency', () => {
    const dep = workload$({ label: 'dep', type: 'test', onStart: vi.fn() });

    const job = job$({ label: 'job', onStart: vi.fn() });
    job.dependsOn(dep);

    vi.mocked(buildFlatTree).mockReturnValue([
      { level: 0, workload: dep },
      { level: 0, workload: job }
    ]);

    expect(buildPlan(job)).toEqual([
      { id: 1, branch: '', dependsOn: [], level: 0, workload: dep },
      { id: 2, branch: '', dependsOn: [1], level: 0, workload: job }
    ]);

    expect(buildFlatTree).toHaveBeenCalledWith(job, true);
  });

  it('should return plan with given workflow and its members as children', () => {
    const wklA = workload$({ label: 'A', type: 'test', onStart: vi.fn() });
    const wklB = workload$({ label: 'B', type: 'test', onStart: vi.fn() });

    const flow = workflow$({ label: 'test', onOrchestrate: vi.fn() });
    flow.push(wklA, wklB);

    vi.mocked(buildFlatTree).mockReturnValue([
      { level: 0, workload: flow },
      { level: 1, workload: wklA },
      { level: 1, workload: wklB },
    ]);

    expect(buildPlan(flow)).toEqual([
      { id: 1, branch: '', dependsOn: [], level: 0, workload: flow },
      { id: 2, branch: '├─ ', dependsOn: [], level: 1, workload: wklA },
      { id: 3, branch: '└─ ', dependsOn: [], level: 1, workload: wklB },
    ]);

    expect(buildFlatTree).toHaveBeenCalledWith(flow, true);
  });

  it('should return plan with given workflow and its nested members as children (long branch)', () => {
    const wklA = workload$({ label: 'A', type: 'test', onStart: vi.fn() });
    const wklB = workload$({ label: 'B', type: 'test', onStart: vi.fn() });
    const wklC = workload$({ label: 'C', type: 'test', onStart: vi.fn() });

    const flwB = workflow$({ label: 'B', onOrchestrate: vi.fn() });
    flwB.push(wklA, wklB);

    const flwA = workflow$({ label: 'A', onOrchestrate: vi.fn() });
    flwA.push(flwB, wklC);

    vi.mocked(buildFlatTree).mockReturnValue([
      { level: 0, workload: flwA },
      { level: 1, workload: flwB },
      { level: 2, workload: wklA },
      { level: 2, workload: wklB },
      { level: 1, workload: wklC },
    ]);

    expect(buildPlan(flwA)).toEqual([
      { id: 1, branch: '', dependsOn: [], level: 0, workload: flwA },
      { id: 2, branch: '├─ ', dependsOn: [], level: 1, workload: flwB },
      { id: 3, branch: '│  ├─ ', dependsOn: [], level: 2, workload: wklA },
      { id: 4, branch: '│  └─ ', dependsOn: [], level: 2, workload: wklB },
      { id: 5, branch: '└─ ', dependsOn: [], level: 1, workload: wklC },
    ]);

    expect(buildFlatTree).toHaveBeenCalledWith(flwA, true);
  });

  it('should return plan with given workflow and its nested members as children (short branch)', () => {
    const wklA = workload$({ label: 'A', type: 'test', onStart: vi.fn() });
    const wklB = workload$({ label: 'B', type: 'test', onStart: vi.fn() });
    const wklC = workload$({ label: 'C', type: 'test', onStart: vi.fn() });

    const flwB = workflow$({ label: 'B', onOrchestrate: vi.fn() });
    flwB.push(wklB, wklC);

    const flwA = workflow$({ label: 'A', onOrchestrate: vi.fn() });
    flwA.push(wklA, flwB);

    vi.mocked(buildFlatTree).mockReturnValue([
      { level: 0, workload: flwA },
      { level: 1, workload: wklA },
      { level: 1, workload: flwB },
      { level: 2, workload: wklB },
      { level: 2, workload: wklC },
    ]);

    expect(buildPlan(flwA)).toEqual([
      { id: 1, branch: '', dependsOn: [], level: 0, workload: flwA },
      { id: 2, branch: '├─ ', dependsOn: [], level: 1, workload: wklA },
      { id: 3, branch: '└─ ', dependsOn: [], level: 1, workload: flwB },
      { id: 4, branch: '   ├─ ', dependsOn: [], level: 2, workload: wklB },
      { id: 5, branch: '   └─ ', dependsOn: [], level: 2, workload: wklC },
    ]);

    expect(buildFlatTree).toHaveBeenCalledWith(flwA, true);
  });
});
