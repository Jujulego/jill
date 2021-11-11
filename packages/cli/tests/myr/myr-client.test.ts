import { Project, Workspace } from '@jujulego/jill-core';
import cp from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';

import { myrServer } from '../../mocks/myr-server';
import { MyrClient } from '../../src/myr/myr-client';
import { logger } from '../../src';

// Setup
beforeAll(() => {
  myrServer.listen();
});

let prj: Project;
let wks: Workspace;
let proc: cp.ChildProcess;

beforeEach(() => {
  jest.resetAllMocks();

  prj = new Project('/prj');
  wks = new Workspace('wks', { name: 'wks' }, prj);

  proc = (new EventEmitter()) as cp.ChildProcess;
  proc.send = jest.fn();

  jest.spyOn(cp, 'fork').mockReturnValue(proc);
  jest.spyOn(prj, 'packageManager').mockResolvedValue('yarn');
});

afterEach(() => {
  myrServer.resetHandlers();
});

afterAll(() => {
  myrServer.close();
});

// Test suites
describe('MyrClient.start', () => {
  // Tests
  it('should start myr process and resolve true when it send "started"', async () => {
    const myr = new MyrClient(prj);
    const prom = myr.start();

    expect(cp.fork).toHaveBeenCalledWith(path.resolve(__dirname, '../../src/myr/myr.process'), [], {
      cwd: prj.root,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    });
    expect(proc.send).toHaveBeenCalledWith('start');

    proc.emit('message', 'started');
    await expect(prom).resolves.toBe(true);
  });

  it('should reject if process rejected', async () => {
    const myr = new MyrClient(prj);
    const prom = myr.start();

    proc.emit('message', { name: 'Error', message: 'Test failed !' });
    await expect(prom).rejects.toEqual({ name: 'Error', message: 'Test failed !' });
  });

  it('should reject if process ended', async () => {
    const myr = new MyrClient(prj);
    const prom = myr.start();

    proc.emit('close', 1, 'SIGINT');
    await expect(prom).rejects.toEqual(new Error('Myr process ended with code 1 by signal SIGINT'));
  });

  it('should parse stdout output and send logs to logger', async () => {
    const stdout = proc.stdout = (new EventEmitter()) as any;
    jest.spyOn(logger, 'log');

    const myr = new MyrClient(prj);
    const prom = myr.start();

    stdout.emit('data', Buffer.from(JSON.stringify({ level: 'info', message: 'test stdout', metadata: 85 })));
    expect(logger.log).toHaveBeenCalledWith('info', 'test stdout', { metadata: 85 });

    proc.emit('message', 'started');
    await expect(prom).resolves.toBe(true);
  });

  it('should pass stderr output to logger', async () => {
    const stderr = proc.stderr = (new EventEmitter()) as any;
    jest.spyOn(logger, 'error');

    const myr = new MyrClient(prj);
    const prom = myr.start();

    stderr.emit('data', Buffer.from('test stderr'));
    expect(logger.error).toHaveBeenCalledWith('test stderr');

    proc.emit('message', 'started');
    await expect(prom).resolves.toBe(true);
  });
});

describe('MyrClient.tasks', () => {
  // Tests
  it('should return all tasks', async () => {
    const myr = new MyrClient(prj);

    await expect(myr.tasks()).resolves.toEqual([
      {
        id: 'mock-1',
        cwd: '/mock',
        cmd: 'test',
        args: [],
        status: 'running'
      }
    ]);
  });
});

describe('MyrClient.spawn', () => {
  // Tests
  it('should return spawned task', async () => {
    const myr = new MyrClient(prj);

    await expect(myr.spawn('/project', 'test', ['--arg'])).resolves.toEqual({
      id: 'mock-spawn',
      cwd: '/project',
      cmd: 'test',
      args: ['--arg'],
      status: 'running'
    });
  });
});

describe('MyrClient.spawnScript', () => {
  // Tests
  it('should return spawned script task', async () => {
    const myr = new MyrClient(prj);

    await expect(myr.spawnScript(wks, 'test', ['--arg'])).resolves.toEqual({
      id: 'mock-spawn',
      cwd: path.resolve('/prj/wks'),
      cmd: 'yarn',
      args: ['test', '--arg'],
      status: 'running'
    });
  });
});

describe('MyrClient.kill', () => {
  // Tests
  it('should return killed task', async () => {
    const myr = new MyrClient(prj);

    await expect(myr.kill('mock-kill')).resolves.toEqual({
      id: 'mock-kill',
      cwd: '/mock',
      cmd: 'test',
      args: [],
      status: 'failed'
    });
  });
});