import { Project, TaskManager, Workspace } from '@jujulego/jill-core';

import { MockTask } from '../../mocks/task';
import { buildCommand, logger } from '../../src';
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
describe('jill build', () => {
  it('should exit 1 if workspace doesn\'t exists', async () => {
    jest.spyOn(project, 'workspace').mockResolvedValue(null);

    // Call
    await expect(buildCommand(project, { workspace: 'does-not-exists' }))
      .resolves.toBe(1);

    // Checks
    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(project.workspace).toHaveBeenCalledWith('does-not-exists');
    expect(logger.fail).toHaveBeenCalledWith('Workspace does-not-exists not found');
  });

  it('should exit 1 if current workspace not found', async () => {
    jest.spyOn(project, 'workspace');
    jest.spyOn(project, 'currentWorkspace').mockResolvedValue(null);

    // Call
    await expect(buildCommand(project, { workspace: undefined }))
      .resolves.toBe(1);

    // Checks
    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(project.workspace).not.toHaveBeenCalled();
    expect(project.currentWorkspace).toHaveBeenCalled();
    expect(logger.fail).toHaveBeenCalledWith('Workspace . not found');
  });

  it('should exit 0 when manager is finished', async () => {
    const wks = new Workspace('./wks', { name: 'wks', version: '1.0.0' }, project);
    const tsk = new MockTask('test', { context: { workspace: wks }});

    jest.spyOn(project, 'workspace').mockResolvedValue(wks);
    jest.spyOn(wks, 'build').mockResolvedValue(tsk);

    jest.spyOn(TaskManager.prototype, 'add').mockImplementation();
    jest.spyOn(TaskManager.prototype, 'on').mockImplementation();
    jest.spyOn(TaskManager.prototype, 'start').mockImplementation();
    jest.spyOn(TaskManager.prototype, 'waitFor').mockResolvedValue([]);

    // Call
    await expect(buildCommand(project, { workspace: 'wks' }))
      .resolves.toBe(0);

    // Checks
    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(project.workspace).toHaveBeenCalledWith('wks');
    expect(wks.build).toHaveBeenCalled();
    expect(TaskManager.prototype.add).toHaveBeenCalledWith(tsk);
    expect(TaskManager.prototype.start).toHaveBeenCalled();
    expect(TaskManager.prototype.on).toHaveBeenCalledWith('started', expect.any(Function));
    expect(TaskManager.prototype.on).toHaveBeenCalledWith('completed', expect.any(Function));
    expect(TaskManager.prototype.waitFor).toHaveBeenCalledWith('finished');
  });

  it('should use current workspace', async () => {
    const wks = new Workspace('./wks', { name: 'wks', version: '1.0.0' }, project);
    const tsk = new MockTask('test', { context: { workspace: wks }});

    jest.spyOn(project, 'workspace').mockResolvedValue(null);
    jest.spyOn(project, 'currentWorkspace').mockResolvedValue(wks);
    jest.spyOn(wks, 'build').mockResolvedValue(tsk);

    jest.spyOn(TaskManager.prototype, 'add').mockImplementation();
    jest.spyOn(TaskManager.prototype, 'on').mockReturnThis();
    jest.spyOn(TaskManager.prototype, 'start').mockImplementation();
    jest.spyOn(TaskManager.prototype, 'waitFor').mockResolvedValue([]);

    // Call
    await expect(buildCommand(project, { workspace: undefined }))
      .resolves.toBe(0);

    // Checks
    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(project.currentWorkspace).toHaveBeenCalled();
    expect(wks.build).toHaveBeenCalled();
    expect(TaskManager.prototype.add).toHaveBeenCalledWith(tsk);
    expect(TaskManager.prototype.start).toHaveBeenCalled();
    expect(TaskManager.prototype.on).toHaveBeenCalledWith('started', expect.any(Function));
    expect(TaskManager.prototype.on).toHaveBeenCalledWith('completed', expect.any(Function));
    expect(TaskManager.prototype.waitFor).toHaveBeenCalledWith('finished');
  });
});
