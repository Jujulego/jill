import { jobPlan } from '@/src/components/job-plan.js';
import { flatJobPlan } from '@/src/trees/flat-job-plan.js';
import { job$, workflow$, workload$ } from '@kyrielle/workload';
import chalk from 'chalk';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Mocks
let stream: NodeJS.WriteStream;
let screen = '';

vi.mock('@/src/trees/flat-job-plan.js');

beforeAll(() => {
  chalk.level = 1;
});

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

    vi.mocked(flatJobPlan).mockReturnValue([
      { id: 1, branch: '', dependsOn: [], level: 0, workload: wkl }
    ]);

    jobPlan(wkl, stream);
    expect(screen).toMatchSnapshot();

    expect(flatJobPlan).toHaveBeenCalledWith(wkl);
  });

  it('should print spawned command', () => {
    const wkl = workload$({ label: 'test', type: 'spawn', onStart: vi.fn() });

    vi.mocked(flatJobPlan).mockReturnValue([
      { id: 1, branch: '', dependsOn: [], level: 0, workload: wkl }
    ]);

    jobPlan(wkl, stream);
    expect(screen).toMatchSnapshot();

    expect(flatJobPlan).toHaveBeenCalledWith(wkl);
  });

  it('should print spawned script and workspace', () => {
    const wkl = workload$({ label: 'test', type: 'script', onStart: vi.fn() });
    Object.assign(wkl, { script: 'script', workspace: { name: 'workspace' } });

    vi.mocked(flatJobPlan).mockReturnValue([
      { id: 1, branch: '', dependsOn: [], level: 0, workload: wkl }
    ]);

    jobPlan(wkl, stream);
    expect(screen).toMatchSnapshot();

    expect(flatJobPlan).toHaveBeenCalledWith(wkl);
  });

  it('should print plan with dependencies', () => {
    const dep = workload$({ label: 'dep', type: 'test', onStart: vi.fn() });

    const job = job$({ label: 'job', onStart: vi.fn() });
    job.dependsOn(dep);

    vi.mocked(flatJobPlan).mockReturnValue([
      { id: 1, branch: '', dependsOn: [], level: 0, workload: dep },
      { id: 2, branch: '', dependsOn: [1], level: 0, workload: job }
    ]);

    jobPlan(job, stream);
    expect(screen).toMatchSnapshot();

    expect(flatJobPlan).toHaveBeenCalledWith(job);
  });

  it('should print plan with workflow members', () => {
    const wklA = workload$({ label: 'A', type: 'test', onStart: vi.fn() });
    const wklB = workload$({ label: 'B', type: 'test', onStart: vi.fn() });

    const flow = workflow$({ label: 'test', onOrchestrate: vi.fn() });
    flow.push(wklA, wklB);

    vi.mocked(flatJobPlan).mockReturnValue([
      { id: 1, branch: '', dependsOn: [], level: 0, workload: flow },
      { id: 2, branch: '├─ ', dependsOn: [], level: 1, workload: wklA },
      { id: 3, branch: '└─ ', dependsOn: [], level: 1, workload: wklB },
    ]);

    jobPlan(flow, stream);
    expect(screen).toMatchSnapshot();

    expect(flatJobPlan).toHaveBeenCalledWith(flow);
  });
});
