import { Project, TaskEvent, TaskEventListener, TaskManager, Workspace } from '@jujulego/jill-core';
import chalk from 'chalk';

import { logger, OraLogger } from '../../src/logger';
import { commandHandler } from '../../src/wrapper';

import { MockTask } from '../../mocks/task';
import { defaultOptions } from './defaults';
import '../logger';

// Setup
jest.mock('../../src/logger');
jest.mock('../../src/wrapper');

chalk.level = 1;

let project: Project;

beforeEach(() => {
  project = new Project('.');

  // Mocks
  jest.restoreAllMocks();

  (commandHandler as jest.MockedFunction<typeof commandHandler>)
    .mockImplementation((handler) => async (args) => { await handler(project, args); });

  jest.spyOn(process, 'exit').mockImplementation();
});

// Tests
describe('jill each', () => {
  it('should exit 1 if no workspace found', async () => {
    jest.spyOn(project, 'workspaces')
      .mockImplementation(async function* (): AsyncGenerator<Workspace> {}); // eslint-disable-line @typescript-eslint/no-empty-function

    // Call
    const { handler } = await import('../../src/commands/each');
    await expect(handler({ script: 'test', ...defaultOptions }))
      .resolves.toBeUndefined();

    // Checks
    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(project.workspaces).toHaveBeenCalled();
    expect(logger.fail).toHaveBeenCalledWith('No workspace found !');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should print tasks status', async () => {
    const wks = new Workspace('./wks', { name: 'wks', version: '1.0.0', scripts: { test: 'test' } }, project);
    const tsk1 = new MockTask('test', ['1'], { workspace: wks });
    const tsk2 = new MockTask('test', ['2'], { workspace: wks });
    const tsk3 = new MockTask('test', ['3'], { workspace: wks });
    const handlers: Partial<Record<TaskEvent, TaskEventListener>> = {};

    jest.spyOn(project, 'workspaces').mockImplementation(async function* () { yield wks; });
    jest.spyOn(wks, 'run').mockResolvedValue(tsk1);

    jest.spyOn(TaskManager.prototype, 'add').mockImplementation();
    jest.spyOn(TaskManager.prototype, 'start').mockImplementation();
    jest.spyOn(TaskManager.prototype, 'on')
      .mockImplementation(function (event, handler) {
        handlers[event] = handler;
        return this;
      });

    // Call
    const { handler } = await import('../../src/commands/each');
    await expect(handler({ ...defaultOptions, script: 'test', '--': ['--arg', 1] }))
      .resolves.toBeUndefined();

    // Checks
    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(project.workspaces).toHaveBeenCalled();
    expect(logger.verbose).toHaveBeenCalledWith('Will run test in wks');
    expect(wks.run).toHaveBeenCalledWith('test', ['--arg', '1']);
    expect(TaskManager.prototype.add).toHaveBeenCalledWith(tsk1);
    expect(TaskManager.prototype.start).toHaveBeenCalled();
    expect(TaskManager.prototype.on).toHaveBeenCalledWith('started', expect.any(Function));
    expect(TaskManager.prototype.on).toHaveBeenCalledWith('completed', expect.any(Function));

    // Activate task 1
    (logger.spin as jest.MockedFunction<typeof OraLogger.prototype.spin>).mockClear();

    handlers.started!(tsk1);
    expect(logger.spin).toHaveBeenCalledWith('Running test in wks ...');

    // Activate task 2 & 3
    (logger.spin as jest.MockedFunction<typeof OraLogger.prototype.spin>).mockClear();

    handlers.started!(tsk2);
    handlers.started!(tsk3);
    expect(logger.spin).toHaveBeenCalledWith('Working in 2 packages ...');
    expect(logger.spin).toHaveBeenCalledWith('Working in 3 packages ...');

    // Complete task 3
    (logger.spin as jest.MockedFunction<typeof OraLogger.prototype.spin>).mockClear();
    (logger.succeed as jest.MockedFunction<typeof OraLogger.prototype.succeed>).mockClear();
    (logger.fail as jest.MockedFunction<typeof OraLogger.prototype.succeed>).mockClear();

    handlers.completed!(tsk2.setStatus('failed'));
    expect(logger.fail).toHaveBeenCalledWith('Failed to build wks');
    expect(logger.spin).toHaveBeenCalledWith('Working in 2 packages ...');

    // Complete task 1 & 2
    (logger.succeed as jest.MockedFunction<typeof OraLogger.prototype.succeed>).mockClear();

    handlers.completed!(tsk2.setStatus('done'));
    handlers.completed!(tsk1.setStatus('done'));
    expect(logger.succeed).toHaveBeenCalledWith('wks built');
  });

  it('should filter workspaces without script', async () => {
    const wks1 = new Workspace('./wks-1', { name: 'wks-1', version: '1.0.0', scripts: { test: 'test' } }, project);
    const wks2 = new Workspace('./wks-2', { name: 'wks-2', version: '1.0.0' }, project);
    const tsk1 = new MockTask('test', [], { workspace: wks1 });
    const tsk2 = new MockTask('test', [], { workspace: wks2 });

    jest.spyOn(project, 'workspaces').mockImplementation(async function* () { yield wks1; yield wks2; });
    jest.spyOn(wks1, 'run').mockResolvedValue(tsk1);
    jest.spyOn(wks2, 'run').mockResolvedValue(tsk2);

    jest.spyOn(TaskManager.prototype, 'add').mockImplementation();
    jest.spyOn(TaskManager.prototype, 'start').mockImplementation();
    jest.spyOn(TaskManager.prototype, 'on').mockReturnThis();

    // Call
    const { handler } = await import('../../src/commands/each');
    await expect(handler({ ...defaultOptions, script: 'test' }))
      .resolves.toBeUndefined();

    // Checks
    expect(project.workspaces).toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith('Workspace wks-2 ignored as it doesn\'t have the test script');
    expect(logger.verbose).toHaveBeenCalledWith('Will run test in wks-1');
  });

  it('should filter private workspaces', async () => {
    const wks1 = new Workspace('./wks-1', { name: 'wks-1', version: '1.0.0', private: true, scripts: { test: 'test' } }, project);
    const wks2 = new Workspace('./wks-2', { name: 'wks-2', version: '1.0.0', scripts: { test: 'test' } }, project);
    const tsk1 = new MockTask('test', [], { workspace: wks1 });
    const tsk2 = new MockTask('test', [], { workspace: wks2 });

    jest.spyOn(project, 'workspaces').mockImplementation(async function* () { yield wks1; yield wks2; });
    jest.spyOn(wks1, 'run').mockResolvedValue(tsk1);
    jest.spyOn(wks2, 'run').mockResolvedValue(tsk2);

    jest.spyOn(TaskManager.prototype, 'add').mockImplementation();
    jest.spyOn(TaskManager.prototype, 'start').mockImplementation();
    jest.spyOn(TaskManager.prototype, 'on').mockReturnThis();

    // Call
    const { handler } = await import('../../src/commands/each');
    await expect(handler({ ...defaultOptions, script: 'test', private: true }))
      .resolves.toBeUndefined();

    // Checks
    expect(project.workspaces).toHaveBeenCalled();
    expect(logger.verbose).toHaveBeenCalledWith('Will run test in wks-1');
  });

  it('should filter affected workspaces', async () => {
    const wks1 = new Workspace('./wks-1', { name: 'wks-1', version: '1.0.0', scripts: { test: 'test' } }, project);
    const wks2 = new Workspace('./wks-2', { name: 'wks-2', version: '1.0.0', scripts: { test: 'test' } }, project);
    const tsk1 = new MockTask('test', [], { workspace: wks1 });
    const tsk2 = new MockTask('test', [], { workspace: wks2 });

    jest.spyOn(project, 'workspaces').mockImplementation(async function* () { yield wks1; yield wks2; });
    jest.spyOn(wks1, 'run').mockResolvedValue(tsk1);
    jest.spyOn(wks1, 'isAffected').mockResolvedValue(true);
    jest.spyOn(wks2, 'run').mockResolvedValue(tsk2);
    jest.spyOn(wks2, 'isAffected').mockResolvedValue(false);

    jest.spyOn(TaskManager.prototype, 'add').mockImplementation();
    jest.spyOn(TaskManager.prototype, 'start').mockImplementation();
    jest.spyOn(TaskManager.prototype, 'on').mockReturnThis();

    // Call
    const { handler } = await import('../../src/commands/each');
    await expect(handler({ ...defaultOptions, script: 'test', affected: 'test' }))
      .resolves.toBeUndefined();

    // Checks
    expect(project.workspaces).toHaveBeenCalled();
    expect(wks1.isAffected).toHaveBeenCalledWith('test');
    expect(wks2.isAffected).toHaveBeenCalledWith('test');
    expect(logger.verbose).toHaveBeenCalledWith('Will run test in wks-1');
  });
});
