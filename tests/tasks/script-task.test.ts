import { Task } from '@jujulego/tasks';
import { waitFor } from '@jujulego/event-tree';
import { vi } from 'vitest';

import { container } from '@/src/inversify.config';
import { JillApplication } from '@/src/jill.application';
import { type Workspace } from '@/src/project/workspace';
import { CommandTask } from '@/src/tasks/command-task';
import { ScriptTask } from '@/src/tasks/script-task';

import { TestBed } from '@/tools/test-bed';
import { TestCommandTask, TestScriptTask } from '@/tools/test-tasks';

// Setup
let bed: TestBed;
let wks: Workspace;

vi.mock('@jujulego/event-tree', async (importOriginal) => {
  const mod: typeof import('@jujulego/event-tree') = await importOriginal();

  return {
    ...mod,
    waitFor: vi.fn(mod.waitFor),
  };
});

beforeAll(() => {
  container.snapshot();
});

beforeEach(() => {
  container.restore();
  container.snapshot();

  bed = new TestBed();
  wks = bed.addWorkspace('wks');

  vi.spyOn(wks, 'getScript').mockReturnValue('jest --script');
  vi.spyOn(wks.project, 'packageManager').mockResolvedValue('npm');
});

describe('new ScriptTask', () => {
  it('should set task context', () => {
    const task = new ScriptTask(wks, 'test', []);

    expect(task.context).toEqual({
      workspace: wks,
      script: 'test',
    });
  });
});

describe('ScriptTask.prepare', () => {
  it('should create a task running the script (npm)', async () => {
    const script = new ScriptTask(wks, 'test', ['--arg']);
    await script.prepare();

    expect(script.tasks).toHaveLength(1);

    const tsk = script.tasks[0] as CommandTask;

    expect(tsk).toBeInstanceOf(CommandTask);
    expect(tsk.group).toBe(script);
    expect(tsk.cmd).toBe('jest');
    expect(tsk.args).toEqual(['--script', '--arg']);
  });

  it('should create a task running the script (yarn)', async () => {
    vi.spyOn(wks.project, 'packageManager').mockResolvedValue('yarn');

    const script = new ScriptTask(wks, 'test', ['--arg']);
    await script.prepare();

    expect(script.tasks).toHaveLength(1);

    const tsk = script.tasks[0] as CommandTask;

    expect(tsk).toBeInstanceOf(CommandTask);
    expect(tsk.group).toBe(script);
    expect(tsk.cmd).toBe('yarn');
    expect(tsk.args).toEqual(['exec', 'jest', '--script', '--arg']);
  });

  it('should interpret jill command, to get its tasks', async () => {
    vi.spyOn(wks, 'getScript').mockReturnValue('jill run test');

    const childTsk = new TestCommandTask(wks, 'jest', ['--script', '--arg']);
    vi.spyOn(JillApplication.prototype, 'tasksOf').mockResolvedValue([childTsk]);

    const script = new ScriptTask(wks, 'test', ['--arg']);
    await script.prepare();

    expect(script.tasks).toHaveLength(1);
    expect(script.tasks).toContain(childTsk);
  });

  it('should create a task spawning jill command, if it generates no tasks', async () => {
    vi.spyOn(wks, 'getScript').mockReturnValue('jill tree');

    vi.spyOn(JillApplication.prototype, 'tasksOf').mockResolvedValue([]);

    const script = new ScriptTask(wks, 'test', ['--arg']);
    await script.prepare();

    const tsk = script.tasks[0] as CommandTask;

    expect(tsk).toBeInstanceOf(CommandTask);
    expect(tsk.group).toBe(script);
    expect(tsk.cmd).toBe('jill');
    expect(tsk.args).toEqual(['tree', '--arg']);
  });

  it('should throw if script does not exist', async () => {
    vi.spyOn(wks, 'getScript').mockReturnValue(null);

    const script = new ScriptTask(wks, 'test', ['--arg']);

    await expect(script.prepare())
      .rejects.toEqual(new Error('No script test in wks'));

    expect(script.tasks).toHaveLength(0);
  });
});

describe('ScriptTask._orchestrate', () => {
  it('should yield all prepared tasks and gain status done when they are done', async () => {
    const script = new TestScriptTask(wks, 'test', ['--arg']);
    await script.prepare();

    const it = script._orchestrate();

    // It emit one task
    let next = await it.next();
    expect(next).toEqual({ done: false, value: expect.any(Task) });

    // Then wait for it to finish
    vi.mocked(waitFor).mockResolvedValue({ failed: 0 });

    next = await it.next();
    expect(next).toEqual({ done: true });

    expect(script.status).toBe('done');
  });

  it('should yield all prepared tasks and gain status failed when one has failed', async () => {
    const script = new TestScriptTask(wks, 'test', ['--arg']);
    await script.prepare();

    const it = script._orchestrate();

    // It emit one task
    let next = await it.next();
    expect(next).toEqual({ done: false, value: expect.any(Task) });

    // Then wait for it to finish
    vi.mocked(waitFor).mockResolvedValue({ failed: 1 });

    next = await it.next();
    expect(next).toEqual({ done: true });

    expect(script.status).toBe('failed');
  });

  it('should throw if script is not yet prepared', async () => {
    const script = new TestScriptTask(wks, 'test', ['--arg']);

    const it = script._orchestrate();
    await expect(it.next())
      .rejects.toEqual(new Error('ScriptTask needs to be prepared. Call prepare before starting it'));
  });
});

describe('ScriptTask._stop', () => {
  it('should stop all inner tasks', async () => {
    const script = new TestScriptTask(wks, 'test', ['--arg']);
    await script.prepare();

    vi.spyOn(script.tasks[0], 'stop');
    script._stop();

    expect(script.tasks[0].stop).toHaveBeenCalled();
  });
});

describe('ScriptTask.complexity', () => {
  it('should return sum of inner tasks', async () => {
    const script = new ScriptTask(wks, 'test', ['--arg']);
    await script.prepare();

    vi.spyOn(script.tasks[0], 'complexity').mockReturnValue(1);

    expect(script.complexity()).toBe(1);
    expect(script.tasks[0].complexity).toHaveBeenCalled();
  });
});

describe('ScriptTask.project', () => {
  it('should return workspace\'s project', () => {
    const script = new ScriptTask(wks, 'test', []);

    expect(script.project).toBe(wks.project);
  });
});
