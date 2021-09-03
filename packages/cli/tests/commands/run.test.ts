import { Project, TaskManager, Workspace } from '@jujulego/jill-core';

import { MockTask } from '../../mocks/task';
import { logger, runCommand } from '../../src';
import '../logger';

// Setup
jest.mock('../../src/logger');
jest.mock('../../src/wrapper');

let project: Project;

beforeEach(() => {
  project = new Project('.');

  // Mocks
  jest.restoreAllMocks();
});

// Tests
describe('jill run', () => {
  it('should exit 1 if workspace doesn\'t exists', async () => {
    jest.spyOn(project, 'workspace').mockResolvedValue(null);

    // Call
    await expect(runCommand(project, { workspace: 'does-not-exists', script: 'test' }))
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
    await expect(runCommand(project, { workspace: undefined, script: 'test' }))
      .resolves.toBe(1);

    // Checks
    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(project.workspace).not.toHaveBeenCalled();
    expect(project.currentWorkspace).toHaveBeenCalled();
    expect(logger.fail).toHaveBeenCalledWith('Workspace . not found');
  });

  it('should exit 0 when manager finished', async () => {
    const wks = new Workspace('./wks', { name: 'wks', version: '1.0.0' }, project);
    const tsk = new MockTask('test', { context: { workspace: wks }});

    jest.spyOn(project, 'workspace').mockResolvedValue(wks);
    jest.spyOn(wks, 'run').mockResolvedValue(tsk);

    jest.spyOn(TaskManager.global, 'add').mockImplementation();
    jest.spyOn(TaskManager.global, 'on').mockImplementation();
    jest.spyOn(TaskManager.global, 'waitFor').mockResolvedValue([]);

    // Call
    await expect(runCommand(project, { workspace: 'wks', script: 'test', '--': ['--arg', 1] }))
      .resolves.toBe(0);

    // Checks
    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(project.workspace).toHaveBeenCalledWith('wks');
    expect(wks.run).toHaveBeenCalledWith('test', ['--arg', '1']);
    expect(TaskManager.global.add).toHaveBeenCalledWith(tsk);
    expect(TaskManager.global.on).toHaveBeenCalledWith('started', expect.any(Function));
    expect(TaskManager.global.on).toHaveBeenCalledWith('completed', expect.any(Function));
    expect(TaskManager.global.waitFor).toHaveBeenCalledWith('finished');
  });

  it('should use current workspace', async () => {
    const wks = new Workspace('./wks', { name: 'wks', version: '1.0.0' }, project);
    const tsk = new MockTask('test', { context: { workspace: wks }});

    jest.spyOn(project, 'workspace');
    jest.spyOn(project, 'currentWorkspace').mockResolvedValue(wks);
    jest.spyOn(wks, 'run').mockResolvedValue(tsk);

    jest.spyOn(TaskManager.global, 'add').mockImplementation();
    jest.spyOn(TaskManager.global, 'on').mockReturnThis();
    jest.spyOn(TaskManager.global, 'waitFor').mockResolvedValue([]);

    // Call
    await expect(runCommand(project, { workspace: undefined, script: 'test' }))
      .resolves.toBe(0);

    // Checks
    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(project.workspace).not.toHaveBeenCalled();
    expect(project.currentWorkspace).toHaveBeenCalled();
    expect(wks.run).toHaveBeenCalledWith('test', undefined);
    expect(TaskManager.global.add).toHaveBeenCalledWith(tsk);
    expect(TaskManager.global.waitFor).toHaveBeenCalledWith('finished');
  });
});
