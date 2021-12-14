import { Project, TaskSet, Workspace } from '@jujulego/jill-core';

import { MockTask } from '../../mocks/task';
import { RunCommand } from '../../src';
import { TestBed, TestCommand } from '../test-bed';
import '../logger';

// Setup

jest.mock('../../src/logger');
jest.mock('../../src/wrapper');

let project: Project;

const TestRunCommand = TestCommand(RunCommand);
const testBed = new TestBed(TestRunCommand);
const defaults = {
  '$0': 'jill',
  _: [],
  verbose: 0,
  project: '/project',
  'package-manager': undefined,
  'deps-mode': 'all',
};

beforeEach(() => {
  testBed.beforeEach();
  project = new Project('.');

  // Mocks
  jest.resetAllMocks();
  jest.restoreAllMocks();

  jest.spyOn(testBed.cmd, 'project', 'get').mockReturnValue(project);
});

// Tests
describe('jill run', () => {
  it('should exit 1 if workspace doesn\'t exists', async () => {
    jest.spyOn(project, 'workspace').mockResolvedValue(null);

    // Call
    await expect(testBed.run({ ...defaults, workspace: 'does-not-exists', script: 'test' }))
      .resolves.toBe(1);

    // Checks
    expect(testBed.spinner.start).toHaveBeenCalledWith('Loading "does-not-exists" workspace');
    expect(project.workspace).toHaveBeenCalledWith('does-not-exists');
    expect(testBed.spinner.fail).toHaveBeenCalledWith('Workspace "does-not-exists" not found');
  });

  it('should exit 1 if current workspace not found', async () => {
    jest.spyOn(project, 'workspace');
    jest.spyOn(project, 'currentWorkspace').mockResolvedValue(null);

    // Call
    await expect(testBed.run({ ...defaults, workspace: undefined, script: 'test' }))
      .resolves.toBe(1);

    // Checks
    expect(testBed.spinner.start).toHaveBeenCalledWith('Loading "." workspace');
    expect(project.workspace).not.toHaveBeenCalled();
    expect(project.currentWorkspace).toHaveBeenCalled();
    expect(testBed.spinner.fail).toHaveBeenCalledWith('Workspace "." not found');
  });

  it('should exit 0 when task-set is finished and all tasks are successful', async () => {
    const wks = new Workspace('./wks', { name: 'wks', version: '1.0.0' } as any, project);
    const tsk = new MockTask('test', { context: { workspace: wks }});

    jest.spyOn(project, 'workspace').mockResolvedValue(wks);
    jest.spyOn(wks, 'run').mockResolvedValue(tsk);

    jest.spyOn(TaskSet.prototype, 'add').mockImplementation();
    jest.spyOn(TaskSet.prototype, 'on').mockImplementation();
    jest.spyOn(TaskSet.prototype, 'waitFor').mockResolvedValue([{ success: 1, failed: 0 }]);

    // Call
    await expect(testBed.run({ ...defaults, workspace: 'wks', script: 'test', '--': ['--arg', 1] }))
      .resolves.toBe(0);

    // Checks
    expect(testBed.spinner.start).toHaveBeenCalledWith('Loading "wks" workspace');
    expect(project.workspace).toHaveBeenCalledWith('wks');
    expect(wks.run).toHaveBeenCalledWith('test', ['--arg', '1'], { buildDeps: 'all' });
    expect(TaskSet.prototype.add).toHaveBeenCalledWith(tsk);
    expect(TaskSet.prototype.on).toHaveBeenCalledWith('started', expect.any(Function));
    expect(TaskSet.prototype.on).toHaveBeenCalledWith('completed', expect.any(Function));
    expect(TaskSet.prototype.waitFor).toHaveBeenCalledWith('finished');
  });

  it('should exit 1 when task-set is finished and a task failed', async () => {
    const wks = new Workspace('./wks', { name: 'wks', version: '1.0.0' } as any, project);
    const tsk = new MockTask('test', { context: { workspace: wks }});

    jest.spyOn(project, 'workspace').mockResolvedValue(wks);
    jest.spyOn(wks, 'run').mockResolvedValue(tsk);

    jest.spyOn(TaskSet.prototype, 'add').mockImplementation();
    jest.spyOn(TaskSet.prototype, 'on').mockImplementation();
    jest.spyOn(TaskSet.prototype, 'waitFor').mockResolvedValue([{ success: 0, failed: 1 }]);

    // Call
    await expect(testBed.run({ ...defaults, workspace: 'wks', script: 'test', '--': ['--arg', 1] }))
      .resolves.toBe(1);

    // Checks
    expect(testBed.spinner.start).toHaveBeenCalledWith('Loading "wks" workspace');
    expect(project.workspace).toHaveBeenCalledWith('wks');
    expect(wks.run).toHaveBeenCalledWith('test', ['--arg', '1'], { buildDeps: 'all' });
    expect(TaskSet.prototype.add).toHaveBeenCalledWith(tsk);
    expect(TaskSet.prototype.on).toHaveBeenCalledWith('started', expect.any(Function));
    expect(TaskSet.prototype.on).toHaveBeenCalledWith('completed', expect.any(Function));
    expect(TaskSet.prototype.waitFor).toHaveBeenCalledWith('finished');
  });

  it('should use current workspace', async () => {
    const wks = new Workspace('./wks', { name: 'wks', version: '1.0.0' } as any, project);
    const tsk = new MockTask('test', { context: { workspace: wks }});

    jest.spyOn(project, 'workspace');
    jest.spyOn(project, 'currentWorkspace').mockResolvedValue(wks);
    jest.spyOn(wks, 'run').mockResolvedValue(tsk);

    jest.spyOn(TaskSet.prototype, 'add').mockImplementation();
    jest.spyOn(TaskSet.prototype, 'on').mockReturnThis();
    jest.spyOn(TaskSet.prototype, 'waitFor').mockResolvedValue([{ success: 1, failed: 0 }]);

    // Call
    await expect(testBed.run({ ...defaults, workspace: undefined, script: 'test' }))
      .resolves.toBe(0);

    // Checks
    expect(testBed.spinner.start).toHaveBeenCalledWith('Loading "." workspace');
    expect(project.workspace).not.toHaveBeenCalled();
    expect(project.currentWorkspace).toHaveBeenCalled();
    expect(wks.run).toHaveBeenCalledWith('test', undefined, { buildDeps: 'all' });
    expect(TaskSet.prototype.add).toHaveBeenCalledWith(tsk);
    expect(TaskSet.prototype.waitFor).toHaveBeenCalledWith('finished');
  });
});
