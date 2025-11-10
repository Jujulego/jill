import { buildFlatTree } from '@/src/cli/utils/flat-tree.js';
import { job$, workflow$, workload$ } from '@jujulego/tasks';
import { describe, expect, it, vi } from 'vitest';

describe('buildFlatTree', () => {
  it('should return tree only containing given workload', () => {
    const wkl = workload$({ label: 'test', type: 'test', onStart: vi.fn() });

    expect(buildFlatTree(wkl)).toEqual([
      { level: 0, workload: wkl }
    ]);
  });

  it('should return tree containing given job, preceded by its dependencies', () => {
    const dep = workload$({ label: 'dep', type: 'test', onStart: vi.fn() });

    const job = job$({ label: 'job', onStart: vi.fn() });
    job.dependsOn(dep);

    expect(buildFlatTree(job)).toEqual([
      { level: 0, workload: dep },
      { level: 0, workload: job }
    ]);
  });

  it('should return tree only containing given workflow', () => {
    const wklA = workload$({ label: 'A', type: 'test', onStart: vi.fn() });
    const wklB = workload$({ label: 'B', type: 'test', onStart: vi.fn() });

    const flow = workflow$({ label: 'test', onOrchestrate: vi.fn() });
    flow.push(wklA, wklB);

    expect(buildFlatTree(flow)).toEqual([
      { level: 0, workload: flow }
    ]);
  });

  it('should return tree containing given workflow and its members as children', () => {
    const wklA = workload$({ label: 'A', type: 'test', onStart: vi.fn() });
    const wklB = workload$({ label: 'B', type: 'test', onStart: vi.fn() });

    const flow = workflow$({ label: 'test', onOrchestrate: vi.fn() });
    flow.push(wklA, wklB);

    expect(buildFlatTree(flow, true)).toEqual([
      { level: 0, workload: flow },
      { level: 1, workload: wklA, workflow: flow },
      { level: 1, workload: wklB, workflow: flow },
    ]);
  });

  it('should return tree only containing given workflow preceded by member dependencies', () => {
    const dep = workload$({ label: 'dep', type: 'test', onStart: vi.fn() });

    const jobA = job$({ label: 'A', type: 'test', onStart: vi.fn() });
    const jobB = job$({ label: 'B', type: 'test', onStart: vi.fn() });
    jobA.dependsOn(dep);
    jobB.dependsOn(dep);

    const flow = workflow$({ label: 'test', onOrchestrate: vi.fn() });
    flow.push(jobA, jobB);

    expect(buildFlatTree(flow)).toEqual([
      { level: 0, workload: dep },
      { level: 0, workload: flow }
    ]);
  });

  it('should return tree containing given workflow and its members as children preceded by member dependencies', () => {
    const dep = workload$({ label: 'dep', type: 'test', onStart: vi.fn() });

    const jobA = job$({ label: 'A', type: 'test', onStart: vi.fn() });
    const jobB = job$({ label: 'B', type: 'test', onStart: vi.fn() });
    jobA.dependsOn(dep);
    jobB.dependsOn(dep);

    const flow = workflow$({ label: 'test', onOrchestrate: vi.fn() });
    flow.push(jobA, jobB);

    expect(buildFlatTree(flow, true)).toEqual([
      { level: 0, workload: dep },
      { level: 0, workload: flow },
      { level: 1, workload: jobA, workflow: flow },
      { level: 1, workload: jobB, workflow: flow },
    ]);
  });
});
