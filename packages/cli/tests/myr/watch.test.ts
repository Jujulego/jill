import { Project, Workspace } from '@jujulego/jill-core';

import '../logger';
import { MockTask } from '../../mocks/task';
import { logger } from '../../src';
import { MyrClient as _MyrClient } from '../../src/myr/myr-client';
import { WatchArgs, watchCommand } from '../../src/myr/watch';

// Mocks
jest.mock('../../src/logger');

jest.mock('../../src/myr/myr-client');
const MyrClient = _MyrClient as jest.MockedClass<typeof _MyrClient>;

// Setup
const defaults: Omit<WatchArgs, 'script' | 'workspace'> = {
  daemon: false
};

let prj: Project;
let wksA: Workspace;
let wksB: Workspace;
let wksC: Workspace;
let tskA: MockTask;

beforeEach(() => {
  jest.resetAllMocks();

  prj = new Project('/prj');
  wksA = new Workspace('wks-a', { name: 'wks-a', dependencies: { 'wks-b': '*' }, devDependencies: { 'wks-c': '*' }} as any, prj);
  wksB = new Workspace('wks-b', { name: 'wks-b', devDependencies: { 'wks-c': '*' }} as any, prj);
  wksC = new Workspace('wks-c', { name: 'wks-c' } as any, prj);
  tskA = new MockTask('test');

  jest.spyOn(prj, 'workspace').mockResolvedValue(wksA);
  jest.spyOn(prj, 'currentWorkspace').mockResolvedValue(wksA);
  jest.spyOn(wksA, 'dependencies').mockImplementation(async function* () { yield wksB; });
  jest.spyOn(wksA, 'devDependencies').mockImplementation(async function* () { yield wksC; });
  jest.spyOn(wksA, 'run').mockResolvedValue(tskA);
  jest.spyOn(wksB, 'devDependencies').mockImplementation(async function* () { yield wksC; });
  jest.spyOn(tskA, 'start').mockImplementation();
  jest.spyOn(tskA, 'waitFor').mockImplementation(async () => {
    tskA._setExitCode(0);
    return [];
  });

  MyrClient.prototype.spawnScript.mockImplementation(async (wks, script, args = []) => ({
    id: `mock-${wks.name}-${script}`,
    cwd: wks.cwd,
    cmd: 'yarn',
    args: [script, ...args],
    status: 'running'
  }));
});

// Tests
describe('jill watch', () => {
  it('should exit 1 if workspace doesn\'t exists', async () => {
    jest.spyOn(prj, 'workspace').mockResolvedValue(null);

    // Call
    await expect(watchCommand(prj, { script: 'test', workspace: 'does-not-exists', ...defaults }))
      .resolves.toBe(1);

    // Checks
    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(prj.workspace).toHaveBeenCalledWith('does-not-exists');
    expect(prj.currentWorkspace).not.toHaveBeenCalled();
    expect(logger.fail).toHaveBeenCalledWith('Workspace does-not-exists not found');
  });

  it('should exit 1 if current workspace not found', async () => {
    jest.spyOn(prj, 'currentWorkspace').mockResolvedValue(null);

    // Call
    await expect(watchCommand(prj, { script: 'test', workspace: undefined, ...defaults }))
      .resolves.toBe(1);

    // Checks
    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(prj.workspace).not.toHaveBeenCalled();
    expect(prj.currentWorkspace).toHaveBeenCalled();
    expect(logger.fail).toHaveBeenCalledWith('Workspace . not found');
  });

  it('should spawn deps watch in myr, asked task in myr and return 0', async () => {
    // Call
    await expect(watchCommand(prj, { script: 'test', workspace: 'wks-a', ...defaults, daemon: true }))
      .resolves.toBe(0);

    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(logger.spin).toHaveBeenCalledWith('Spawning dependencies watch tasks');
    expect(MyrClient).toHaveBeenCalledWith(prj);
    expect(MyrClient.prototype.spawnScript).toHaveBeenCalledTimes(3);
    expect(MyrClient.prototype.spawnScript).toHaveBeenCalledWith(wksC, 'watch');
    expect(MyrClient.prototype.spawnScript).toHaveBeenCalledWith(wksB, 'watch');
    expect(MyrClient.prototype.spawnScript).toHaveBeenCalledWith(wksA, 'test', undefined);
    expect(logger.succeed).toHaveBeenCalledWith('3 watch tasks spawned');
  });

  it('should spawn task in myr with given args', async () => {
    // Call
    await expect(watchCommand(prj, { script: 'test', workspace: 'wks-a', ...defaults, daemon: true, '--': ['--arg'] }))
      .resolves.toBe(0);

    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(logger.spin).toHaveBeenCalledWith('Spawning dependencies watch tasks');
    expect(logger.spin).toHaveBeenCalledWith('Spawning test task');
    expect(MyrClient).toHaveBeenCalledWith(prj);
    expect(MyrClient.prototype.spawnScript).toHaveBeenCalledTimes(3);
    expect(MyrClient.prototype.spawnScript).toHaveBeenCalledWith(wksC, 'watch');
    expect(MyrClient.prototype.spawnScript).toHaveBeenCalledWith(wksB, 'watch');
    expect(MyrClient.prototype.spawnScript).toHaveBeenCalledWith(wksA, 'test', ['--arg']);
    expect(logger.succeed).toHaveBeenCalledWith('3 watch tasks spawned');
  });

  it('should spawn deps watch in myr, asked task locally and return 0 when task end successfully', async () => {
    // Call
    await expect(watchCommand(prj, { script: 'test', workspace: 'wks-a', ...defaults }))
      .resolves.toBe(0);

    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(logger.spin).toHaveBeenCalledWith('Spawning dependencies watch tasks');
    expect(MyrClient).toHaveBeenCalledWith(prj);
    expect(MyrClient.prototype.spawnScript).toHaveBeenCalledTimes(2);
    expect(MyrClient.prototype.spawnScript).toHaveBeenCalledWith(wksC, 'watch');
    expect(MyrClient.prototype.spawnScript).toHaveBeenCalledWith(wksB, 'watch');
    expect(logger.succeed).toHaveBeenCalledWith('2 watch tasks spawned');
    expect(wksA.run).toHaveBeenCalledWith('test', undefined, { buildDeps: 'none' });
    expect(tskA.start).toHaveBeenCalled();
    expect(tskA.waitFor).toHaveBeenCalledWith('done', 'failed');
  });

  it('should spawn task locally with given args', async () => {
    // Call
    await expect(watchCommand(prj, { script: 'test', workspace: 'wks-a', ...defaults, '--': ['--arg'] }))
      .resolves.toBe(0);

    expect(logger.spin).toHaveBeenCalledWith('Loading project');
    expect(logger.spin).toHaveBeenCalledWith('Spawning dependencies watch tasks');
    expect(MyrClient).toHaveBeenCalledWith(prj);
    expect(MyrClient.prototype.spawnScript).toHaveBeenCalledTimes(2);
    expect(MyrClient.prototype.spawnScript).toHaveBeenCalledWith(wksC, 'watch');
    expect(MyrClient.prototype.spawnScript).toHaveBeenCalledWith(wksB, 'watch');
    expect(logger.succeed).toHaveBeenCalledWith('2 watch tasks spawned');
    expect(wksA.run).toHaveBeenCalledWith('test', ['--arg'], { buildDeps: 'none' });
    expect(tskA.start).toHaveBeenCalled();
    expect(tskA.waitFor).toHaveBeenCalledWith('done', 'failed');
  });

  it('should return 1 when task failed', async () => {
    jest.spyOn(tskA, 'waitFor').mockImplementation(async () => {
      tskA._setExitCode(1);
      return [];
    });

    // Call
    await expect(watchCommand(prj, { script: 'test', workspace: 'wks-a', ...defaults }))
      .resolves.toBe(1);
  });
});