import { Project, Workspace } from '@jujulego/jill-core';
import chalk from 'chalk';

import { SpawnTaskMode, WatchTaskStatus } from '../src/common';
import { MyrClient as _MyrClient } from '../src/myr-client';
import { WatchArgs, WatchCommand } from '../src/watch.command';
import { MockTask } from '../mocks/task';
import { TestArgs, TestBed } from './test-bed';
import './logger';

// Mocks
jest.mock('../src/myr-client');
const MyrClient = _MyrClient as jest.MockedClass<typeof _MyrClient>;

// Setup
chalk.level = 1;

let prj: Project;
let wksA: Workspace;
let wksB: Workspace;
let wksC: Workspace;
let tskA: MockTask;
let testBed: TestBed<WatchArgs, WatchCommand>;

const defaults: TestArgs<Omit<WatchArgs, 'script'>> = {
  verbose: 0,
  plugins: [],
  project: '/project',
  'package-manager': undefined,
  workspace: undefined,
  follow: false
};

beforeEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();

  prj = new Project('/prj');
  wksA = new Workspace('wks-a', { name: 'wks-a', dependencies: { 'wks-b': '*' }, devDependencies: { 'wks-c': '*' }} as any, prj);
  wksB = new Workspace('wks-b', { name: 'wks-b', devDependencies: { 'wks-c': '*' }} as any, prj);
  wksC = new Workspace('wks-c', { name: 'wks-c' } as any, prj);
  tskA = new MockTask('test');

  testBed = new TestBed(new WatchCommand());
  jest.spyOn(testBed.command, 'project', 'get').mockReturnValue(prj);

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
    status: WatchTaskStatus.running,
    mode: SpawnTaskMode.managed,
    watchOn: [],
    watchedBy: [],
  }));
});

// Tests
describe('jill watch', () => {
  it('should exit 1 if workspace doesn\'t exists', async () => {
    jest.spyOn(prj, 'workspace').mockResolvedValue(null);

    // Call
    await expect(testBed.run({ ...defaults, script: 'test', workspace: 'does-not-exists' }))
      .resolves.toBe(1);

    // Checks
    expect(testBed.spinner.start).toHaveBeenCalledWith('Loading "does-not-exists" workspace');
    expect(prj.workspace).toHaveBeenCalledWith('does-not-exists');
    expect(prj.currentWorkspace).not.toHaveBeenCalled();
    expect(testBed.spinner.fail).toHaveBeenCalledWith('Workspace "does-not-exists" not found');
  });

  it('should exit 1 if current workspace not found', async () => {
    jest.spyOn(prj, 'currentWorkspace').mockResolvedValue(null);

    // Call
    await expect(testBed.run({ ...defaults, script: 'test', workspace: undefined }))
      .resolves.toBe(1);

    // Checks
    expect(testBed.spinner.start).toHaveBeenCalledWith('Loading "." workspace');
    expect(prj.workspace).not.toHaveBeenCalled();
    expect(prj.currentWorkspace).toHaveBeenCalled();
    expect(testBed.spinner.fail).toHaveBeenCalledWith('Workspace "." not found');
  });

  it('should spawn deps watch in myr, asked task in myr and return 0', async () => {
    // Call
    await expect(testBed.run({ ...defaults, script: 'test', workspace: 'wks-a' }))
      .resolves.toBe(0);

    expect(testBed.spinner.start).toHaveBeenCalledWith('Loading "wks-a" workspace');
    expect(testBed.spinner.start).toHaveBeenCalledWith('Spawning dependencies watch tasks');
    expect(MyrClient).toHaveBeenCalledWith(prj);
    expect(MyrClient.prototype.spawnScript).toHaveBeenCalledTimes(3);
    expect(MyrClient.prototype.spawnScript).toHaveBeenCalledWith(wksC, 'watch', [], { mode: SpawnTaskMode.auto, watchOn: [] });
    expect(MyrClient.prototype.spawnScript).toHaveBeenCalledWith(wksB, 'watch', [], { mode: SpawnTaskMode.auto, watchOn: ['mock-wks-c-watch'] });
    expect(MyrClient.prototype.spawnScript).toHaveBeenCalledWith(wksA, 'test', [], { watchOn: ['mock-wks-b-watch'] });
    expect(testBed.spinner.succeed).toHaveBeenCalledWith('3 watch tasks spawned');
  });

  it('should spawn task in myr with given args', async () => {
    // Call
    await expect(testBed.run({ ...defaults, script: 'test', workspace: 'wks-a', '--': ['--arg'] }))
      .resolves.toBe(0);

    expect(testBed.spinner.start).toHaveBeenCalledWith('Loading "wks-a" workspace');
    expect(testBed.spinner.start).toHaveBeenCalledWith('Spawning dependencies watch tasks');
    expect(testBed.spinner.start).toHaveBeenCalledWith('Spawning test task');
    expect(MyrClient).toHaveBeenCalledWith(prj);
    expect(MyrClient.prototype.spawnScript).toHaveBeenCalledTimes(3);
    expect(MyrClient.prototype.spawnScript).toHaveBeenCalledWith(wksC, 'watch', [], { mode: SpawnTaskMode.auto, watchOn: [] });
    expect(MyrClient.prototype.spawnScript).toHaveBeenCalledWith(wksB, 'watch', [], { mode: SpawnTaskMode.auto, watchOn: ['mock-wks-c-watch'] });
    expect(MyrClient.prototype.spawnScript).toHaveBeenCalledWith(wksA, 'test', ['--arg'], { watchOn: ['mock-wks-b-watch'] });
    expect(testBed.spinner.succeed).toHaveBeenCalledWith('3 watch tasks spawned');
  });

  it('should spawn deps watch in myr, asked task in myr then follow logs', async () => {
    jest.spyOn(testBed.command, 'log').mockImplementation();
    jest.spyOn(MyrClient.prototype, 'logs$').mockImplementation(async function* () {
      yield { level: 'info', message: 'Test log' };
      yield { level: 'info', message: 'Test wks-c log', task: 'mock-wks-c-watch' };
      yield { level: 'info', message: 'Test wks-b log', task: 'mock-wks-b-watch' };
      yield { level: 'info', message: 'Test wks-a log', task: 'mock-wks-a-test' };
    });

    // Call
    await expect(testBed.run({ ...defaults, script: 'test', workspace: 'wks-a', follow: true }))
      .resolves.toBe(0);

    expect(testBed.spinner.start).toHaveBeenCalledWith('Loading "wks-a" workspace');
    expect(testBed.spinner.start).toHaveBeenCalledWith('Spawning dependencies watch tasks');
    expect(MyrClient).toHaveBeenCalledWith(prj);
    expect(MyrClient.prototype.spawnScript).toHaveBeenCalledTimes(3);
    expect(testBed.spinner.succeed).toHaveBeenCalledWith('3 watch tasks spawned');
    expect(testBed.command.log).not.toHaveBeenCalledWith('Test log');
    expect(testBed.command.log).not.toHaveBeenCalledWith('Test wks-c log');
    expect(testBed.command.log).not.toHaveBeenCalledWith('Test wks-b log');
    expect(testBed.command.log).toHaveBeenCalledWith(chalk`{white Test wks-a log}`);
    expect(testBed.command.log).toHaveBeenCalledTimes(1);
  });
});
