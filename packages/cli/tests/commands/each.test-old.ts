import { Project, TaskSet, Workspace } from '@jujulego/jill-core';
import chalk from 'chalk';

import { EachArgs, EachCommand } from '../../src/commands/each.command';
import { MockTask } from '../../mocks/task';
import { TestArgs, TestBed } from '../test-bed';
import '../logger';

// Setup
chalk.level = 1;

let project: Project;
let testBed: TestBed<EachArgs, EachCommand>;

const defaults: TestArgs<Omit<EachArgs, 'script'>> = {
  verbose: 0,
  plugins: [],
  project: '/project',
  'package-manager': undefined,
  'deps-mode': 'all',
  private: undefined,
  affected: undefined,
  'affected-rev-sort': undefined,
  'affected-rev-fallback': 'master',
};

beforeEach(() => {
  project = new Project('.');
  testBed = new TestBed(new EachCommand());

  // Mocks
  jest.resetAllMocks();
  jest.restoreAllMocks();

  jest.spyOn(testBed.command, 'project', 'get').mockReturnValue(project);
});

// Tests
describe('jill each', () => {
  it('should exit 1 if no workspace found', async () => {
    jest.spyOn(project, 'workspaces')
      .mockImplementation(async function* (): AsyncGenerator<Workspace> {}); // eslint-disable-line @typescript-eslint/no-empty-function

    // Call
    await expect(testBed.run({ ...defaults, script: 'test' }))
      .resolves.toBe(1);

    // Checks
    expect(project.workspaces).toHaveBeenCalled();
    expect(testBed.spinner.fail).toHaveBeenCalledWith('No workspace found !');
  });

  it('should exit 0 when task-set is is finished and all tasks are successful', async () => {
    const wks = new Workspace('./wks', { name: 'wks', version: '1.0.0', scripts: { test: 'test' } } as any, project);
    const tsk = new MockTask('test', { context: { workspace: wks }});

    jest.spyOn(project, 'workspaces').mockImplementation(async function* () { yield wks; });
    jest.spyOn(wks, 'run').mockResolvedValue(tsk);

    jest.spyOn(TaskSet.prototype, 'add').mockImplementation();
    jest.spyOn(TaskSet.prototype, 'on').mockImplementation();
    jest.spyOn(TaskSet.prototype, 'waitFor').mockResolvedValue([{ success: 1, failed: 0 }]);

    // Call
    await expect(testBed.run({ ...defaults, script: 'test', '--': ['--arg', 1] }))
      .resolves.toBe(0);

    // Checks
    expect(project.workspaces).toHaveBeenCalled();
    expect(testBed.logger.verbose).toHaveBeenCalledWith('Will run test in wks');
    expect(wks.run).toHaveBeenCalledWith('test', ['--arg', '1'], { buildDeps: 'all' });
    expect(TaskSet.prototype.add).toHaveBeenCalledWith(tsk);
    expect(TaskSet.prototype.on).toHaveBeenCalledWith('started', expect.any(Function));
    expect(TaskSet.prototype.on).toHaveBeenCalledWith('completed', expect.any(Function));
    expect(TaskSet.prototype.waitFor).toHaveBeenCalledWith('finished');
  });

  it('should exit 1 when task-set is is finished and a task failed', async () => {
    const wks = new Workspace('./wks', { name: 'wks', version: '1.0.0', scripts: { test: 'test' } } as any, project);
    const tsk = new MockTask('test', { context: { workspace: wks }});

    jest.spyOn(project, 'workspaces').mockImplementation(async function* () { yield wks; });
    jest.spyOn(wks, 'run').mockResolvedValue(tsk);

    jest.spyOn(TaskSet.prototype, 'add').mockImplementation();
    jest.spyOn(TaskSet.prototype, 'on').mockImplementation();
    jest.spyOn(TaskSet.prototype, 'waitFor').mockResolvedValue([{ success: 0, failed: 1 }]);

    // Call
    await expect(testBed.run({ ...defaults, script: 'test', '--': ['--arg', 1] }))
      .resolves.toBe(1);

    // Checks
    expect(project.workspaces).toHaveBeenCalled();
    expect(testBed.logger.verbose).toHaveBeenCalledWith('Will run test in wks');
    expect(wks.run).toHaveBeenCalledWith('test', ['--arg', '1'], { buildDeps: 'all' });
    expect(TaskSet.prototype.add).toHaveBeenCalledWith(tsk);
    expect(TaskSet.prototype.on).toHaveBeenCalledWith('started', expect.any(Function));
    expect(TaskSet.prototype.on).toHaveBeenCalledWith('completed', expect.any(Function));
    expect(TaskSet.prototype.waitFor).toHaveBeenCalledWith('finished');
  });

  it('should filter workspaces without script', async () => {
    const wks1 = new Workspace('./wks-1', { name: 'wks-1', version: '1.0.0', scripts: { test: 'test' } } as any, project);
    const wks2 = new Workspace('./wks-2', { name: 'wks-2', version: '1.0.0' } as any, project);
    const tsk1 = new MockTask('test', { context: { workspace: wks1 }});
    const tsk2 = new MockTask('test', { context: { workspace: wks2 }});

    jest.spyOn(project, 'workspaces').mockImplementation(async function* () { yield wks1; yield wks2; });
    jest.spyOn(wks1, 'run').mockResolvedValue(tsk1);
    jest.spyOn(wks2, 'run').mockResolvedValue(tsk2);

    jest.spyOn(TaskSet.prototype, 'add').mockImplementation();
    jest.spyOn(TaskSet.prototype, 'on').mockReturnThis();
    jest.spyOn(TaskSet.prototype, 'waitFor').mockResolvedValue([{ success: 1, failed: 0 }]);

    // Call
    await expect(testBed.run({ ...defaults, script: 'test' }))
      .resolves.toBe(0);

    // Checks
    expect(project.workspaces).toHaveBeenCalled();
    expect(testBed.logger.verbose).toHaveBeenCalledWith('Will run test in wks-1');
  });

  it('should filter private workspaces', async () => {
    const wks1 = new Workspace('./wks-1', { name: 'wks-1', version: '1.0.0', private: true, scripts: { test: 'test' } } as any, project);
    const wks2 = new Workspace('./wks-2', { name: 'wks-2', version: '1.0.0', scripts: { test: 'test' } } as any, project);
    const tsk1 = new MockTask('test', { context: { workspace: wks1 }});
    const tsk2 = new MockTask('test', { context: { workspace: wks2 }});

    jest.spyOn(project, 'workspaces').mockImplementation(async function* () { yield wks1; yield wks2; });
    jest.spyOn(wks1, 'run').mockResolvedValue(tsk1);
    jest.spyOn(wks2, 'run').mockResolvedValue(tsk2);

    jest.spyOn(TaskSet.prototype, 'add').mockImplementation();
    jest.spyOn(TaskSet.prototype, 'on').mockReturnThis();
    jest.spyOn(TaskSet.prototype, 'waitFor').mockResolvedValue([{ success: 1, failed: 0 }]);

    // Call
    await expect(testBed.run({ ...defaults, script: 'test', private: true }))
      .resolves.toBe(0);

    // Checks
    expect(project.workspaces).toHaveBeenCalled();
    expect(testBed.logger.verbose).toHaveBeenCalledWith('Will run test in wks-1');
  });

  it('should filter affected workspaces', async () => {
    const wks1 = new Workspace('./wks-1', { name: 'wks-1', version: '1.0.0', scripts: { test: 'test' } } as any, project);
    const wks2 = new Workspace('./wks-2', { name: 'wks-2', version: '1.0.0', scripts: { test: 'test' } } as any, project);
    const tsk1 = new MockTask('test', { context: { workspace: wks1 }});
    const tsk2 = new MockTask('test', { context: { workspace: wks2 }});

    jest.spyOn(project, 'workspaces').mockImplementation(async function* () { yield wks1; yield wks2; });
    jest.spyOn(wks1, 'run').mockResolvedValue(tsk1);
    jest.spyOn(wks1, 'isAffected').mockResolvedValue(true);
    jest.spyOn(wks2, 'run').mockResolvedValue(tsk2);
    jest.spyOn(wks2, 'isAffected').mockResolvedValue(false);

    jest.spyOn(TaskSet.prototype, 'add').mockImplementation();
    jest.spyOn(TaskSet.prototype, 'on').mockReturnThis();
    jest.spyOn(TaskSet.prototype, 'waitFor').mockResolvedValue([{ success: 1, failed: 0 }]);

    // Call
    await expect(testBed.run({ ...defaults, script: 'test', affected: 'test' }))
      .resolves.toBe(0);

    // Checks
    expect(project.workspaces).toHaveBeenCalled();
    expect(wks1.isAffected).toHaveBeenCalledWith('test');
    expect(wks2.isAffected).toHaveBeenCalledWith('test');
    expect(testBed.logger.verbose).toHaveBeenCalledWith('Will run test in wks-1');
  });
});
