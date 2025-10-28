import { planCommand } from '@/src/cli/bases/job-module.js';
import { run } from '@/src/cli/commands.js';
import { withLogger } from '@/src/cli/middlewares/logger.js';
import { loadWorkspace, withWorkspace, type WorkspaceArgs } from '@/src/cli/middlewares/workspace.js';
import type { Workspace } from '@/src/projects/workspace.js';
import { TestBed } from '@/tools/test-bed.js';
import { TestScriptTask } from '@/tools/test-tasks.js';
import type { TaskSet } from '@jujulego/tasks';
import { globalScope$ } from '@kyrielle/injector';
import { pipe$, var$ } from 'kyrielle';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import yargs, { type Argv } from 'yargs';

// Mocks
vi.mock('@/src/cli/middlewares/workspace.js');

// Setup
let bed: TestBed;
let task: TestScriptTask;
let workspace: Workspace;

beforeEach(() => {
  vi.resetAllMocks();

  bed = new TestBed();
  workspace = bed.addWorkspace('test');
  task = new TestScriptTask(workspace, 'vitest', []);

  vi.mocked(withWorkspace).mockImplementation((argv) => argv as Argv<WorkspaceArgs>);
  vi.mocked(loadWorkspace).mockResolvedValue(workspace);

  vi.spyOn(workspace, 'run').mockResolvedValue(task);
});

afterEach(() => {
  globalScope$().clear();
});

// Tests
describe('jill run', () => {
  it('should run script in loaded workspace', async () => {
    const tasks$ = var$<TaskSet>();

    await pipe$(yargs(), withLogger, planCommand(run, tasks$))
      .parseAsync('run test');

    expect(tasks$.defer()?.tasks).toStrictEqual([task]);
    expect(workspace.run).toHaveBeenCalledWith('test', [], { buildDeps: 'all', buildScript: 'build' });
  });

  it('should use given dependency selection mode', async () => {
    await pipe$(yargs(), withLogger, planCommand(run, var$()))
      .parseAsync('run -d prod test');

    expect(workspace.run).toHaveBeenCalledWith('test', [], { buildDeps: 'prod', buildScript: 'build' });
  });

  it('should fail if script does not exists', async () => {
    vi.mocked(workspace.run).mockResolvedValue(null);

    await expect(
      pipe$(yargs(), withLogger, planCommand(run, var$()))
        .exitProcess(false)
        .showHelpOnFail(false)
        .parseAsync('run test')
    ).rejects.toThrowError();
  });

  it('should pass down unknown arguments', async () => {
    await pipe$(yargs(), withLogger, planCommand(run, var$()))
      .parseAsync('run test --arg');

    expect(workspace.run).toHaveBeenCalledWith('test', ['--arg'], { buildDeps: 'all', buildScript: 'build' });
  });

  it('should pass down unparsed arguments', async () => {
    await pipe$(yargs(), withLogger, planCommand(run, var$()))
      .parseAsync('run test -- -d toto');

    expect(workspace.run).toHaveBeenCalledWith('test', ['-d', 'toto'], { buildDeps: 'all', buildScript: 'build' });
  });
});
