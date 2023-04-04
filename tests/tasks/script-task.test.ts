import { container } from '@/src/inversify.config';
import { type Workspace } from '@/src/project/workspace';
import { ScriptTask } from '@/src/tasks/script-task';

import { TestBed } from '@/tools/test-bed';
import { CommandTask } from '@/src/tasks/command-task';

// Setup
let bed: TestBed;
let wks: Workspace;

beforeAll(() => {
  container.snapshot();
});

beforeEach(() => {
  container.restore();
  container.snapshot();

  bed = new TestBed();
  wks = bed.addWorkspace('wks');

  jest.spyOn(wks, 'getScript').mockReturnValue('jest --script');
  jest.spyOn(wks.project, 'packageManager').mockResolvedValue('npm');
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

    expect(script.scriptTasks).toHaveLength(1);

    expect(script.task).toBeInstanceOf(CommandTask);
    expect(script.task.group).toBe(script);
    expect(script.task.cmd).toBe('jest');
    expect(script.task.args).toEqual(['--script', '--arg']);
  });

  it('should create a task running the script (yarn)', async () => {
    jest.spyOn(wks.project, 'packageManager').mockResolvedValue('yarn');

    const script = new ScriptTask(wks, 'test', ['--arg']);
    await script.prepare();

    expect(script.scriptTasks).toHaveLength(1);

    expect(script.task).toBeInstanceOf(CommandTask);
    expect(script.task.group).toBe(script);
    expect(script.task.cmd).toBe('yarn');
    expect(script.task.args).toEqual(['jest', '--script', '--arg']);
  });

  it('should throw if script does not exist', async () => {
    jest.spyOn(wks, 'getScript').mockReturnValue(null);

    const script = new ScriptTask(wks, 'test', ['--arg']);

    await expect(script.prepare())
      .rejects.toEqual(new Error('No script test in wks'));

    expect(script.scriptTasks).toHaveLength(0);
  });
});

describe('ScriptTask.complexity', () => {
  it('should return sum of inner tasks', async () => {
    const script = new ScriptTask(wks, 'test', ['--arg']);
    await script.prepare();

    jest.spyOn(script.task, 'complexity').mockReturnValue(1);

    expect(script.complexity()).toBe(1);
    expect(script.task.complexity).toHaveBeenCalled();
  });
});

describe('ScriptTask.project', () => {
  it('should return workspace\'s project', () => {
    const script = new ScriptTask(wks, 'test', []);

    expect(script.project).toBe(wks.project);
  });
});
