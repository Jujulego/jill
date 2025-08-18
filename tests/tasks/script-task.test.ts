import { PlannerService } from '@/src/cli/services/planner.service.js';
import { type Workspace } from '@/src/projects/workspace.js';
import { CommandTask } from '@/src/tasks/command-task.js';
import { ScriptTask } from '@/src/tasks/script-task.js';
import { CONFIG } from '@/src/tokens.js';
import { TestBed } from '@/tools/test-bed.js';
import { TestCommandTask, TestScriptTask } from '@/tools/test-tasks.js';
import { Task, TaskSet } from '@jujulego/tasks';
import { globalScope$, inject$ } from '@kyrielle/injector';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Setup
let bed: TestBed;
let wks: Workspace;

beforeEach(() => {
  // Setup config
  globalScope$().set(CONFIG, Promise.resolve({ jobs: 1, hooks: true }));

  // Setup project
  bed = new TestBed();
  wks = bed.addWorkspace('wks');

  vi.spyOn(wks, 'getScript').mockImplementation((script) => ({ test: 'jest --script' })[script] ?? null);
  vi.spyOn(wks.project, 'packageManager').mockResolvedValue('npm');
});

afterEach(() => {
  globalScope$().clear();
});

// Tests
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

  it('should create a task running the script with its hooks (npm)', async () => {
    vi.spyOn(wks, 'getScript').mockImplementation(
      (script) => ({ pretest: 'echo pre-hook', test: 'jest --script', posttest: 'echo post-hook' })[script] ?? null
    );

    const script = new ScriptTask(wks, 'test', ['--arg']);
    await script.prepare();

    expect(script.tasks).toHaveLength(3);

    const preTask = script.tasks[0] as CommandTask;

    expect(preTask).toBeInstanceOf(CommandTask);
    expect(preTask.group).toBe(script);
    expect(preTask.cmd).toBe('echo');
    expect(preTask.args).toEqual(['pre-hook']);

    const task = script.tasks[1] as CommandTask;

    expect(task).toBeInstanceOf(CommandTask);
    expect(task.group).toBe(script);
    expect(task.cmd).toBe('jest');
    expect(task.args).toEqual(['--script', '--arg']);

    const postTask = script.tasks[2] as CommandTask;

    expect(postTask).toBeInstanceOf(CommandTask);
    expect(postTask.group).toBe(script);
    expect(postTask.cmd).toBe('echo');
    expect(postTask.args).toEqual(['post-hook']);
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

  it('should create a task running the script with its hooks (yarn)', async () => {
    vi.spyOn(wks.project, 'packageManager').mockResolvedValue('yarn');
    vi.spyOn(wks, 'getScript').mockImplementation(
      (script) => ({ pretest: 'echo pre-hook', test: 'jest --script', posttest: 'echo post-hook' })[script] ?? null
    );

    const script = new ScriptTask(wks, 'test', ['--arg']);
    await script.prepare();

    expect(script.tasks).toHaveLength(3);

    const preTask = script.tasks[0] as CommandTask;

    expect(preTask).toBeInstanceOf(CommandTask);
    expect(preTask.group).toBe(script);
    expect(preTask.cmd).toBe('yarn');
    expect(preTask.args).toEqual(['exec', 'echo', 'pre-hook']);

    const task = script.tasks[1] as CommandTask;

    expect(task).toBeInstanceOf(CommandTask);
    expect(task.group).toBe(script);
    expect(task.cmd).toBe('yarn');
    expect(task.args).toEqual(['exec', 'jest', '--script', '--arg']);

    const postTask = script.tasks[2] as CommandTask;

    expect(postTask).toBeInstanceOf(CommandTask);
    expect(postTask.group).toBe(script);
    expect(postTask.cmd).toBe('yarn');
    expect(postTask.args).toEqual(['exec', 'echo', 'post-hook']);
  });

  it('should interpret jill command, to get its tasks', async () => {
    vi.spyOn(wks, 'getScript').mockImplementation((script) => ({ test: 'jill run test' })[script] ?? null);

    const childTask = new TestCommandTask(wks, 'jest', ['--script', '--arg']);
    const childTasks = new TaskSet();
    childTasks.add(childTask);

    vi.spyOn(inject$(PlannerService), 'plan').mockResolvedValue(childTasks);

    const script = new ScriptTask(wks, 'test', ['--arg']);
    await script.prepare();

    expect(script.tasks).toHaveLength(1);
    expect(script.tasks).toContain(childTask);
  });

  it('should create a task spawning jill command, if it generates no tasks', async () => {
    vi.spyOn(inject$(PlannerService), 'plan');
    vi.spyOn(wks, 'getScript').mockImplementation((script) => ({ test: 'jill tree' })[script] ?? null);

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

describe('ScriptTask.onOrchestrate', () => {
  it('should yield all prepared tasks and gain status done when they are done', async () => {
    const script = new TestScriptTask(wks, 'test', ['--arg']);
    await script.prepare();

    const it = script.onOrchestrate();

    // It emits one task
    let next = await it.next();
    expect(next).toEqual({ done: false, value: expect.any(Task) });

    // Then when it finishes
    setTimeout(() => next.value!.events$.emit('status.done', { status: 'done', previous: 'running' }), 0);

    next = await it.next();
    expect(next).toEqual({ done: true });

    expect(script.status).toBe('done');
  });

  it('should yield all prepared tasks and hooks script in order and gain status done when they are done', async () => {
    vi.spyOn(wks, 'getScript').mockImplementation(
      (script) => ({ pretest: 'echo pre-hook', test: 'jest --script', posttest: 'echo post-hook' })[script] ?? null
    );

    const script = new TestScriptTask(wks, 'test', []);
    await script.prepare();

    const it = script.onOrchestrate();

    // First it emits the pre hook task
    let next = await it.next();
    expect(next.done).toBe(false);
    expect((next.value as Task)).toMatchObject({ cmd: 'echo', args: ['pre-hook'] });

    // Then when it finishes
    setTimeout(() => next.value!.events$.emit('status.done', { status: 'done', previous: 'running' }), 0);

    // Then it emits the script task
    next = await it.next();
    expect(next.done).toBe(false);
    expect((next.value as Task)).toMatchObject({ cmd: 'jest', args: ['--script'] });

    // Then when it finishes
    setTimeout(() => next.value!.events$.emit('status.done', { status: 'done', previous: 'running' }), 0);

    // Finally it emits the post hook task
    next = await it.next();
    expect(next.done).toBe(false);
    expect((next.value as Task)).toMatchObject({ cmd: 'echo', args: ['post-hook'] });

    // Then when it finishes
    setTimeout(() => next.value!.events$.emit('status.done', { status: 'done', previous: 'running' }), 0);

    next = await it.next();
    expect(next).toEqual({ done: true });

    expect(script.status).toBe('done');
  });

  it('should yield all prepared tasks and gain status failed when one has failed', async () => {
    const script = new TestScriptTask(wks, 'test', ['--arg']);
    await script.prepare();

    const it = script.onOrchestrate();

    // It emits one task
    let next = await it.next();
    expect(next).toEqual({ done: false, value: expect.any(Task) });

    // Then when it finishes
    setTimeout(() => next.value!.events$.emit('status.failed', { status: 'failed', previous: 'running' }), 0);

    next = await it.next();
    expect(next).toEqual({ done: true });

    expect(script.status).toBe('failed');
  });

  it('should throw if script is not yet prepared', async () => {
    const script = new TestScriptTask(wks, 'test', ['--arg']);

    const it = script.onOrchestrate();
    await expect(it.next())
      .rejects.toEqual(new Error('ScriptTask needs to be prepared. Call prepare before starting it'));
  });
});

describe('ScriptTask._stop', () => {
  it('should stop all inner tasks', async () => {
    const script = new TestScriptTask(wks, 'test', ['--arg']);
    await script.prepare();

    vi.spyOn(script.tasks[0], 'stop');
    await script.onStop();

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
