import { exec } from '@/src/commands.js';
import { command$ } from '@/src/jobs/command$.js';
import { withLogger } from '@/src/middlewares/with-logger.js';
import { loadWorkspace, withWorkspace, type WorkspaceArgs } from '@/src/middlewares/with-workspace.js';
import type { Workspace } from '@/src/projects/workspace.js';
import { jobCommandPlan } from '@/src/wrappers/job-command-plan.js';
import { TestBed } from '@/tools/test-bed.js';
import { globalScope$ } from '@kyrielle/injector';
import { type Job$, type SpawnJob$ } from '@kyrielle/workload';
import { pipe$, var$ } from 'kyrielle';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import yargs, { type Argv } from 'yargs';

// Mocks
vi.mock('@/src/middlewares/with-workspace.js');

// Setup
let bed: TestBed;
let job: SpawnJob$;
let workspace: Workspace;

beforeEach(() => {
  vi.resetAllMocks();

  bed = new TestBed();
  workspace = bed.addWorkspace('test');
  job = command$(workspace, 'vitest');

  vi.mocked(withWorkspace).mockImplementation((argv) => argv as Argv<WorkspaceArgs>);
  vi.mocked(loadWorkspace).mockResolvedValue(workspace);

  vi.spyOn(workspace, 'exec').mockResolvedValue(job);
});

afterEach(() => {
  globalScope$().clear();
});

// Tests
describe('jill exec', () => {
  it('should run command in loaded workspace', async () => {
    const job$ = var$<Job$>();

    await pipe$(yargs(), withLogger, jobCommandPlan(exec, job$))
      .parseAsync('exec test');

    expect(job$.defer()).toStrictEqual(job);
    expect(workspace.exec).toHaveBeenCalledWith('test', { buildDeps: 'all', buildScript: 'build' });
  });

  it('should use given dependency selection mode', async () => {
    await pipe$(yargs(), withLogger, jobCommandPlan(exec, var$()))
      .parseAsync('exec test -d prod');

    expect(workspace.exec).toHaveBeenCalledWith('test', { buildDeps: 'prod', buildScript: 'build' });
  });

  it('should pass down unknown arguments', async () => {
    await pipe$(yargs(), withLogger, jobCommandPlan(exec, var$()))
      .parseAsync('exec test --arg');

    expect(workspace.exec).toHaveBeenCalledWith('test --arg', { buildDeps: 'all', buildScript: 'build' });
  });

  it('should pass down unparsed arguments', async () => {
    await pipe$(yargs(), withLogger, jobCommandPlan(exec, var$()))
      .parseAsync('exec test -- -d toto');

    expect(workspace.exec).toHaveBeenCalledWith('test -d toto', { buildDeps: 'all', buildScript: 'build' });
  });
});
