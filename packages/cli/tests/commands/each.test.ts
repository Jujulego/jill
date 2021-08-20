import { Project, TaskManager, Workspace } from '@jujulego/jill-core';

import { eachCommand, logger } from '../../src';

import { MockTask } from '../../mocks/task';
import '../logger';

// Setup
jest.mock('../../src/logger');

let project: Project;

beforeEach(() => {
  project = new Project('.');

  // Mocks
  jest.restoreAllMocks();
});

// Tests
describe('jill each', () => {
  it('should exit 1 if no workspace found', async () => {
    jest.spyOn(project, 'workspaces')
      .mockImplementation(async function* (): AsyncGenerator<Workspace> {}); // eslint-disable-line @typescript-eslint/no-empty-function

    // Call
    await expect(eachCommand(project, { script: 'test', affected: undefined, private: undefined }))
      .resolves.toBe(1);

    // Checks
    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(project.workspaces).toHaveBeenCalled();
    expect(logger.fail).toHaveBeenCalledWith('No workspace found !');
  });

  it('should exit 0 when manager is finished', async () => {
    const wks = new Workspace('./wks', { name: 'wks', version: '1.0.0', scripts: { test: 'test' } }, project);
    const tsk = new MockTask('test', [], { context: { workspace: wks }});

    jest.spyOn(project, 'workspaces').mockImplementation(async function* () { yield wks; });
    jest.spyOn(wks, 'run').mockResolvedValue(tsk);

    jest.spyOn(TaskManager.prototype, 'add').mockImplementation();
    jest.spyOn(TaskManager.prototype, 'on').mockImplementation();
    jest.spyOn(TaskManager.prototype, 'start').mockImplementation();
    jest.spyOn(TaskManager.prototype, 'waitFor').mockResolvedValue([]);

    // Call
    await expect(eachCommand(project, { script: 'test', affected: undefined, private: undefined, '--': ['--arg', 1] }))
      .resolves.toBe(0);

    // Checks
    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(project.workspaces).toHaveBeenCalled();
    expect(logger.verbose).toHaveBeenCalledWith('Will run test in wks');
    expect(wks.run).toHaveBeenCalledWith('test', ['--arg', '1']);
    expect(TaskManager.prototype.add).toHaveBeenCalledWith(tsk);
    expect(TaskManager.prototype.start).toHaveBeenCalled();
    expect(TaskManager.prototype.on).toHaveBeenCalledWith('started', expect.any(Function));
    expect(TaskManager.prototype.on).toHaveBeenCalledWith('completed', expect.any(Function));
    expect(TaskManager.prototype.waitFor).toHaveBeenCalledWith('finished');
  });

  it('should filter workspaces without script', async () => {
    const wks1 = new Workspace('./wks-1', { name: 'wks-1', version: '1.0.0', scripts: { test: 'test' } }, project);
    const wks2 = new Workspace('./wks-2', { name: 'wks-2', version: '1.0.0' }, project);
    const tsk1 = new MockTask('test', [], { context: { workspace: wks1 }});
    const tsk2 = new MockTask('test', [], { context: { workspace: wks2 }});

    jest.spyOn(project, 'workspaces').mockImplementation(async function* () { yield wks1; yield wks2; });
    jest.spyOn(wks1, 'run').mockResolvedValue(tsk1);
    jest.spyOn(wks2, 'run').mockResolvedValue(tsk2);

    jest.spyOn(TaskManager.prototype, 'add').mockImplementation();
    jest.spyOn(TaskManager.prototype, 'on').mockReturnThis();
    jest.spyOn(TaskManager.prototype, 'start').mockImplementation();
    jest.spyOn(TaskManager.prototype, 'waitFor').mockResolvedValue([]);

    // Call
    await expect(eachCommand(project, { script: 'test', affected: undefined, private: undefined }))
      .resolves.toBe(0);

    // Checks
    expect(project.workspaces).toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith('Workspace wks-2 ignored as it doesn\'t have the test script');
    expect(logger.verbose).toHaveBeenCalledWith('Will run test in wks-1');
  });

  it('should filter private workspaces', async () => {
    const wks1 = new Workspace('./wks-1', { name: 'wks-1', version: '1.0.0', private: true, scripts: { test: 'test' } }, project);
    const wks2 = new Workspace('./wks-2', { name: 'wks-2', version: '1.0.0', scripts: { test: 'test' } }, project);
    const tsk1 = new MockTask('test', [], { context: { workspace: wks1 }});
    const tsk2 = new MockTask('test', [], { context: { workspace: wks2 }});

    jest.spyOn(project, 'workspaces').mockImplementation(async function* () { yield wks1; yield wks2; });
    jest.spyOn(wks1, 'run').mockResolvedValue(tsk1);
    jest.spyOn(wks2, 'run').mockResolvedValue(tsk2);

    jest.spyOn(TaskManager.prototype, 'add').mockImplementation();
    jest.spyOn(TaskManager.prototype, 'on').mockReturnThis();
    jest.spyOn(TaskManager.prototype, 'start').mockImplementation();
    jest.spyOn(TaskManager.prototype, 'waitFor').mockResolvedValue([]);

    // Call
    await expect(eachCommand(project, { script: 'test', affected: undefined, private: true }))
      .resolves.toBe(0);

    // Checks
    expect(project.workspaces).toHaveBeenCalled();
    expect(logger.verbose).toHaveBeenCalledWith('Will run test in wks-1');
  });

  it('should filter affected workspaces', async () => {
    const wks1 = new Workspace('./wks-1', { name: 'wks-1', version: '1.0.0', scripts: { test: 'test' } }, project);
    const wks2 = new Workspace('./wks-2', { name: 'wks-2', version: '1.0.0', scripts: { test: 'test' } }, project);
    const tsk1 = new MockTask('test', [], { context: { workspace: wks1 }});
    const tsk2 = new MockTask('test', [], { context: { workspace: wks2 }});

    jest.spyOn(project, 'workspaces').mockImplementation(async function* () { yield wks1; yield wks2; });
    jest.spyOn(wks1, 'run').mockResolvedValue(tsk1);
    jest.spyOn(wks1, 'isAffected').mockResolvedValue(true);
    jest.spyOn(wks2, 'run').mockResolvedValue(tsk2);
    jest.spyOn(wks2, 'isAffected').mockResolvedValue(false);

    jest.spyOn(TaskManager.prototype, 'add').mockImplementation();
    jest.spyOn(TaskManager.prototype, 'on').mockReturnThis();
    jest.spyOn(TaskManager.prototype, 'start').mockImplementation();
    jest.spyOn(TaskManager.prototype, 'waitFor').mockResolvedValue([]);

    // Call
    await expect(eachCommand(project, { script: 'test', affected: 'test', private: undefined }))
      .resolves.toBe(0);

    // Checks
    expect(project.workspaces).toHaveBeenCalled();
    expect(wks1.isAffected).toHaveBeenCalledWith('test');
    expect(wks2.isAffected).toHaveBeenCalledWith('test');
    expect(logger.verbose).toHaveBeenCalledWith('Will run test in wks-1');
  });
});
