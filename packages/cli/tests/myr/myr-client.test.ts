import { Project, Workspace } from '@jujulego/jill-core';
import cp from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';

import { myrServer } from '../../mocks/myr-server';
import { MyrClient } from '../../src/myr/myr-client';
import { logger } from '../../src';
import '../logger';

// Class
class MyrClientTest extends MyrClient {
  public async _autoStart<T>(fn: () => Promise<T>): Promise<T> {
    return super._autoStart(fn);
  }
}

// Setup
beforeAll(() => {
  myrServer.listen();
});

let prj: Project;
let wks: Workspace;
let myr: MyrClientTest;
let proc: cp.ChildProcess;

beforeEach(() => {
  jest.resetAllMocks();

  prj = new Project('/prj');
  wks = new Workspace('wks', { _id: '', name: 'wks', version: '', readme: '' }, prj);
  myr = new MyrClientTest(prj);

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
describe('MyrClient._autoStart', () => {
  let started: boolean;

  beforeEach(() => {
    started = false;
    jest.spyOn(myr, 'start').mockImplementation(async () => { started = true; });
  });

  // Tests
  it('should run function once and return it\'s result', async () => {
    const fun = jest.fn().mockResolvedValue('ok');

    await expect(myr._autoStart(fun)).resolves.toBe('ok');
    expect(myr.start).not.toHaveBeenCalled();
  });

  it('should run function once and throw it\'s error', async () => {
    const fun = jest.fn().mockRejectedValue(new Error('failed'));

    await expect(myr._autoStart(fun)).rejects.toEqual(new Error('failed'));
    expect(myr.start).not.toHaveBeenCalled();
  });

  it('should rerun function after starting myr process', async () => {
    const fun = jest.fn().mockImplementation(async () => {
      if (started) {
        return 'ok';
      } else {
        throw { code: 'ECONNREFUSED' };
      }
    });

    await expect(myr._autoStart(fun)).resolves.toBe('ok');
    expect(myr.start).toHaveBeenCalledTimes(1);
    expect(fun).toHaveBeenCalledTimes(2);
  });
});

describe('MyrClient.start', () => {
  // Tests
  it('should start myr process and resolve true when it send "started"', async () => {
    const prom = myr.start();

    expect(cp.fork).toHaveBeenCalledWith(path.resolve(__dirname, '../../src/myr/myr.process'), [], {
      cwd: prj.root,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    });
    expect(proc.send).toHaveBeenCalledWith('start');

    proc.emit('message', 'started');
    await expect(prom).resolves.toBeUndefined();
  });

  it('should reject if process rejected', async () => {
    const prom = myr.start();

    proc.emit('message', { name: 'Error', message: 'Test failed !' });
    await expect(prom).rejects.toEqual({ name: 'Error', message: 'Test failed !' });
  });

  it('should reject if process ended', async () => {
    const prom = myr.start();

    proc.emit('close', 1, 'SIGINT');
    await expect(prom).rejects.toEqual(new Error('Myr process ended with code 1 by signal SIGINT'));
  });

  it('should parse stdout output and send logs to logger', async () => {
    const stdout = proc.stdout = (new EventEmitter()) as any;
    jest.spyOn(logger, 'log');

    const prom = myr.start();

    stdout.emit('data', Buffer.from(JSON.stringify({ level: 'info', message: 'test stdout', metadata: 85 })) + '\n');
    expect(logger.log).toHaveBeenCalledWith('info', 'test stdout', { metadata: 85 });

    proc.emit('message', 'started');
    await expect(prom).resolves.toBeUndefined();
  });

  it('should pass stderr output to logger', async () => {
    const stderr = proc.stderr = (new EventEmitter()) as any;
    jest.spyOn(logger, 'error');

    const prom = myr.start();

    stderr.emit('data', Buffer.from('test stderr'));
    expect(logger.error).toHaveBeenCalledWith('test stderr');

    proc.emit('message', 'started');
    await expect(prom).resolves.toBeUndefined();
  });
});

describe('MyrClient.tasks', () => {
  beforeEach(() => {
    jest.spyOn(myr, '_autoStart').mockImplementation((fn) => fn());
  });

  // Tests
  it('should return all tasks', async () => {
    await expect(myr.tasks()).resolves.toEqual([
      {
        id: 'mock-1',
        cwd: '/mock',
        cmd: 'test',
        args: [],
        status: 'running'
      }
    ]);
    
    expect(myr._autoStart).toHaveBeenCalledTimes(1);
  });
});

describe('MyrClient.spawn', () => {
  beforeEach(() => {
    jest.spyOn(myr, '_autoStart').mockImplementation((fn) => fn());
  });

  // Tests
  it('should return spawned task', async () => {
    await expect(myr.spawn('/project', 'test', ['--arg'])).resolves.toEqual({
      id: 'mock-spawn',
      cwd: '/project',
      cmd: 'test',
      args: ['--arg'],
      status: 'running'
    });

    expect(myr._autoStart).toHaveBeenCalledTimes(1);
  });

  it('should return spawned task with default args', async () => {
    await expect(myr.spawn('/project', 'test')).resolves.toEqual({
      id: 'mock-spawn',
      cwd: '/project',
      cmd: 'test',
      args: [],
      status: 'running'
    });

    expect(myr._autoStart).toHaveBeenCalledTimes(1);
  });
});

describe('MyrClient.spawnScript', () => {
  beforeEach(() => {
    jest.spyOn(myr, '_autoStart').mockImplementation((fn) => fn());
  });

  // Tests
  it('should return spawned script task', async () => {
    await expect(myr.spawnScript(wks, 'test', ['--arg'])).resolves.toEqual({
      id: 'mock-spawn',
      cwd: path.resolve('/prj/wks'),
      cmd: 'yarn',
      args: ['test', '--arg'],
      status: 'running'
    });

    expect(myr._autoStart).toHaveBeenCalledTimes(1);
  });

  it('should return spawned script task with default args', async () => {
    await expect(myr.spawnScript(wks, 'test')).resolves.toEqual({
      id: 'mock-spawn',
      cwd: path.resolve('/prj/wks'),
      cmd: 'yarn',
      args: ['test'],
      status: 'running'
    });

    expect(myr._autoStart).toHaveBeenCalledTimes(1);
  });
});

describe('MyrClient.kill', () => {
  beforeEach(() => {
    jest.spyOn(myr, '_autoStart').mockImplementation((fn) => fn());
  });

  // Tests
  it('should return killed task', async () => {
    await expect(myr.kill('mock-kill')).resolves.toEqual({
      id: 'mock-kill',
      cwd: '/mock',
      cmd: 'test',
      args: [],
      status: 'failed'
    });

    expect(myr._autoStart).toHaveBeenCalledTimes(1);
  });
});