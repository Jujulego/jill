import type { ScriptWorkflow$ } from '@/src/jobs/run-script$.js';
import { withLogger } from '@/src/middlewares/logger.js';
import { loadWorkspace, withWorkspace, type WorkspaceArgs } from '@/src/middlewares/workspace.js';
import { run } from '@/src/commands.js';
import type { Workspace } from '@/src/projects/workspace.js';
import { jobCommandPlan } from '@/src/wrappers/job-command-plan.js';
import { TestBed } from '@/tools/test-bed.js';
import { type Job$, workflow$ } from '@jujulego/tasks';
import { globalScope$ } from '@kyrielle/injector';
import { pipe$, var$ } from 'kyrielle';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import yargs, { type Argv } from 'yargs';

// Mocks
vi.mock('@/src/cli/middlewares/workspace.js');

// Setup
let bed: TestBed;
let job: ScriptWorkflow$;
let workspace: Workspace;

beforeEach(() => {
  vi.resetAllMocks();

  bed = new TestBed();
  workspace = bed.addWorkspace('test');
  job = workflow$({ label: 'vitest', onOrchestrate: vi.fn() }) as ScriptWorkflow$;

  vi.mocked(withWorkspace).mockImplementation((argv) => argv as Argv<WorkspaceArgs>);
  vi.mocked(loadWorkspace).mockResolvedValue(workspace);

  vi.spyOn(workspace, 'run').mockResolvedValue(job);
});

afterEach(() => {
  globalScope$().clear();
});

// Tests
describe('jill run', () => {
  it('should run script in loaded workspace', async () => {
    const job$ = var$<Job$>();

    await pipe$(yargs(), withLogger, jobCommandPlan(run, job$))
      .parseAsync('run test');

    expect(job$.defer()).toStrictEqual(job);
    expect(workspace.run).toHaveBeenCalledWith('test', [], { buildDeps: 'all', buildScript: 'build' });
  });

  it('should use given dependency selection mode', async () => {
    await pipe$(yargs(), withLogger, jobCommandPlan(run, var$()))
      .parseAsync('run -d prod test');

    expect(workspace.run).toHaveBeenCalledWith('test', [], { buildDeps: 'prod', buildScript: 'build' });
  });

  it('should fail if script does not exists', async () => {
    vi.mocked(workspace.run).mockResolvedValue(null);

    await expect(
      pipe$(yargs(), withLogger, jobCommandPlan(run, var$()))
        .exitProcess(false)
        .showHelpOnFail(false)
        .parseAsync('run test')
    ).rejects.toThrowError();
  });

  it('should pass down unknown arguments', async () => {
    await pipe$(yargs(), withLogger, jobCommandPlan(run, var$()))
      .parseAsync('run test --arg');

    expect(workspace.run).toHaveBeenCalledWith('test', ['--arg'], { buildDeps: 'all', buildScript: 'build' });
  });

  it('should pass down unparsed arguments', async () => {
    await pipe$(yargs(), withLogger, jobCommandPlan(run, var$()))
      .parseAsync('run test -- -d toto');

    expect(workspace.run).toHaveBeenCalledWith('test', ['-d', 'toto'], { buildDeps: 'all', buildScript: 'build' });
  });
});
