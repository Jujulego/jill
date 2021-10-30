import cp from 'child_process';
import { EventEmitter } from 'events';

import { logger, SpawnTask, SpawnTaskFailed, SpawnTaskStream } from '../../src';

import '../utils/logger';
import { TestSpawnTask } from '../utils/task';

beforeEach(() => {
  jest.resetAllMocks();
});

// Test suites
describe('SpawnTask.constructor', () => {
  // Tests
  it('should use current cwd by default', () => {
    const task = new SpawnTask('test');

    expect(task.cwd).toBe(process.cwd());
  });

  it('should use cwd given in options', () => {
    const task = new SpawnTask('test', [], { cwd: '/test' });

    expect(task.cwd).toBe('/test');
  });
});

describe('SpawnTask.start', () => {
  it('should spawn process and mark task as done if it\'s successful', () => {
    const task = new SpawnTask('test', ['arg1', 'arg2'], { cwd: '/test' });
    const proc = new EventEmitter();

    jest.spyOn(cp, 'execFile')
      .mockReturnValue(proc as cp.ChildProcess);

    const spy = jest.fn();
    task.on('done', spy);

    // Start task
    task.start();

    expect(cp.execFile).toHaveBeenCalledTimes(1);
    expect(cp.execFile).toHaveBeenCalledWith('test', ['arg1', 'arg2'], {
      cwd: '/test',
      shell: true,
      windowsHide: true,
      env: expect.objectContaining({
        FORCE_COLOR: process.env.FORCE_COLOR || '1'
      })
    });

    // Complete process
    proc.emit('close', 0);

    expect(task.status).toBe('done');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should spawn process and mark task as failed if it fails', () => {
    const task = new SpawnTask('test', ['arg1', 'arg2'], { cwd: '/test' });
    const proc = new EventEmitter();

    jest.spyOn(cp, 'execFile')
      .mockReturnValue(proc as cp.ChildProcess);

    const spy = jest.fn();
    task.on('failed', spy);

    // Start task
    task.start();

    expect(cp.execFile).toHaveBeenCalledTimes(1);
    expect(cp.execFile).toHaveBeenCalledWith('test', ['arg1', 'arg2'], {
      cwd: '/test',
      shell: true,
      windowsHide: true,
      env: expect.objectContaining({
        FORCE_COLOR: process.env.FORCE_COLOR || '1'
      })
    });

    // Complete process
    proc.emit('close', 1);

    expect(task.status).toBe('failed');
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('SpawnTask.stop', () => {
  it('should kill process and mark task done', async () => {
    // Start a task
    const task = new SpawnTask('test', [], { cwd: '/test' });
    const proc = (new EventEmitter()) as cp.ChildProcess;
    proc.kill = () => true;

    jest.spyOn(cp, 'execFile').mockReturnValue(proc);
    jest.spyOn(proc, 'kill').mockImplementation();

    task.start();

    // Stop it
    task.stop();

    expect(proc.kill).toHaveBeenCalledTimes(1);
    proc.emit('close', 0);

    expect(task.status).toBe('done');
  });

  it('should kill process and mark task failed', async () => {
    // Start a task
    const task = new SpawnTask('test', [], { cwd: '/test' });
    const proc = (new EventEmitter()) as cp.ChildProcess;
    proc.kill = () => true;

    jest.spyOn(cp, 'execFile').mockReturnValue(proc);
    jest.spyOn(proc, 'kill').mockImplementation();

    task.start();

    // Stop it
    task.stop();

    expect(proc.kill).toHaveBeenCalledTimes(1);
    proc.emit('close', 1);

    expect(task.status).toBe('failed');
  });
});

describe('SpawnTask.name', function () {
  it('should return executed command', () => {
    const task = new SpawnTask('test', ['arg1', 'arg2']);
    expect(task.name).toBe('test arg1 arg2');
  });
});

describe('SpawnTask.streams', () => {
  it('should yield all streamed data', async () => {
    const task = new TestSpawnTask('test');
    const streamsGen = task.streams();

    // stdout
    let prom = streamsGen.next();
    task.emit('data', 'stdout', 'test stdout');
    await expect(prom).resolves.toEqual({ value: ['stdout', 'test stdout'], done: false });

    // stderr
    prom = streamsGen.next();
    task.emit('data', 'stderr', 'test stderr');
    await expect(prom).resolves.toEqual({ value: ['stderr', 'test stderr'], done: false });
  });

  it('should end on done', async () => {
    const task = new TestSpawnTask('test');
    const streamsGen = task.streams();

    // done
    const prom = streamsGen.next();
    task.emit('done');
    await expect(prom).resolves.toEqual({ done: true });
  });

  it('should throw on failed', async () => {
    const task = new TestSpawnTask('test');
    const streamsGen = task.streams();

    // failed
    const prom = streamsGen.next();
    task.emit('failed');
    await expect(prom).rejects.toEqual(new SpawnTaskFailed(task));
  });
});

for (const stream of ['stdout', 'stderr'] as SpawnTaskStream[]) {
  const other = stream === 'stdout' ? 'stderr' : 'stdout';

  describe(`SpawnTask.${stream}`, () => {
    it('should yield all streamed data', async () => {
      const task = new TestSpawnTask('test');
      const streamGen = task[stream]();

      // stdout
      const prom = streamGen.next();
      task.emit('data', other, `test ${other}`);
      task.emit('data', stream, `test ${stream}`);
      await expect(prom).resolves.toEqual({ value: `test ${stream}`, done: false });
    });

    it('should end on done', async () => {
      const task = new TestSpawnTask('test');
      const streamGen = task[stream]();

      // done
      const prom = streamGen.next();
      task.emit('done');
      await expect(prom).resolves.toEqual({ done: true });
    });

    it('should throw on failed', async () => {
      const task = new TestSpawnTask('test');
      const streamGen = task[stream]();

      // failed
      const prom = streamGen.next();
      task.emit('failed');
      await expect(prom).rejects.toEqual(new SpawnTaskFailed(task));
    });
  });
}

// Independent tests
describe('spawned process standard streams', () => {
  test('SpawnTask should log and emit all received data, lines by lines', () => {
    // Start a task
    const task = new SpawnTask('test', [], {});
    const proc = (new EventEmitter()) as cp.ChildProcess;
    proc.stdout = (new EventEmitter()) as any;
    proc.stderr = (new EventEmitter()) as any;

    jest.spyOn(cp, 'execFile').mockReturnValue(proc);
    jest.spyOn(logger, 'log');

    const spy = jest.fn();
    task.on('data', spy);

    task.start();

    // Send data on stdout
    proc.stdout?.emit('data', Buffer.from('test'));
    proc.stdout?.emit('data', Buffer.from(' stdout\n'));
    expect(spy).toHaveBeenCalledWith('stdout', 'test stdout');
    expect(logger.log).toHaveBeenCalledWith('info', 'test stdout');

    // Send data on stderr
    proc.stderr?.emit('data', Buffer.from('test stderr\n'));
    expect(spy).toHaveBeenCalledWith('stderr', 'test stderr');
    expect(logger.log).toHaveBeenCalledWith('info', 'test stderr');
  });

  test('SpawnTask should log received data with custom level', () => {
    // Start a task
    const task = new SpawnTask('test', [], { streamLogLevel: 'warn' });
    const proc = (new EventEmitter()) as cp.ChildProcess;
    proc.stdout = (new EventEmitter()) as any;
    proc.stderr = (new EventEmitter()) as any;

    jest.spyOn(cp, 'execFile').mockReturnValue(proc);
    jest.spyOn(logger, 'log');

    task.start();

    // Send data on stdout
    proc.stdout?.emit('data', Buffer.from('test stdout\n'));
    expect(logger.log).toHaveBeenCalledWith('warn', 'test stdout');

    // Send data on stderr
    proc.stderr?.emit('data', Buffer.from('test stderr\n'));
    expect(logger.log).toHaveBeenCalledWith('warn', 'test stderr');
  });

  test('SpawnTask should log received data with custom level for stderr', () => {
    // Start a task
    const task = new SpawnTask('test', [], { streamLogLevel: { stderr: 'warn' } });
    const proc = (new EventEmitter()) as cp.ChildProcess;
    proc.stdout = (new EventEmitter()) as any;
    proc.stderr = (new EventEmitter()) as any;

    jest.spyOn(cp, 'execFile').mockReturnValue(proc);
    jest.spyOn(logger, 'log');

    task.start();

    // Send data on stdout
    proc.stdout?.emit('data', Buffer.from('test stdout\nsuccess'));
    expect(logger.log).toHaveBeenCalledWith('info', 'test stdout');

    // Send data on stderr
    proc.stderr?.emit('data', Buffer.from('test stderr\n'));
    expect(logger.log).toHaveBeenCalledWith('warn', 'test stderr');
  });
});