import { planCommand } from '@/src/cli/bases/task-module.js';
import { exec } from '@/src/cli/commands.js';
import { withLogger } from '@/src/cli/middlewares/logger.js';
import { loadWorkspace, withWorkspace, type WorkspaceArgs } from '@/src/cli/middlewares/workspace.js';
import type { Workspace } from '@/src/projects/workspace.js';
import { TestBed } from '@/tools/test-bed.js';
import { TestCommandTask } from '@/tools/test-tasks.js';
import type { TaskSet } from '@jujulego/tasks';
import { globalScope$ } from '@kyrielle/injector';
import { pipe$, var$ } from 'kyrielle';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import yargs, { type Argv } from 'yargs';

// Mocks
vi.mock('@/src/cli/middlewares/workspace.js');

// Setup
let bed: TestBed;
let task: TestCommandTask;
let workspace: Workspace;

beforeEach(() => {
  vi.resetAllMocks();

  bed = new TestBed();
  workspace = bed.addWorkspace('test');
  task = new TestCommandTask(workspace, 'vitest', []);

  vi.mocked(withWorkspace).mockImplementation((argv) => argv as Argv<WorkspaceArgs>);
  vi.mocked(loadWorkspace).mockResolvedValue(workspace);

  vi.spyOn(workspace, 'exec').mockResolvedValue(task);
});

afterEach(() => {
  globalScope$().clear();
});

// Tests
describe('jill exec', () => {
  it('should run command in loaded workspace', async () => {
    const tasks$ = var$<TaskSet>();

    await pipe$(yargs(), withLogger, planCommand(exec, tasks$))
      .parseAsync('exec test');

    expect(tasks$.defer()?.tasks).toStrictEqual([task]);
    expect(workspace.exec).toHaveBeenCalledWith('test', [], { buildDeps: 'all', buildScript: 'build' });
  });

  it('should use given dependency selection mode', async () => {
    await pipe$(yargs(), withLogger, planCommand(exec, var$()))
      .parseAsync('exec test -d prod');

    expect(workspace.exec).toHaveBeenCalledWith('test', [], { buildDeps: 'prod', buildScript: 'build' });
  });

  it('should pass down unknown arguments', async () => {
    await pipe$(yargs(), withLogger, planCommand(exec, var$()))
      .parseAsync('exec test --arg');

    expect(workspace.exec).toHaveBeenCalledWith('test', ['--arg'], { buildDeps: 'all', buildScript: 'build' });
  });

  it('should pass down unparsed arguments', async () => {
    await pipe$(yargs(), withLogger, planCommand(exec, var$()))
      .parseAsync('exec test -- -d toto');

    expect(workspace.exec).toHaveBeenCalledWith('test', ['-d', 'toto'], { buildDeps: 'all', buildScript: 'build' });
  });
});
