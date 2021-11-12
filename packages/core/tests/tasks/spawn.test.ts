import cp from 'child_process';
import { EventEmitter } from 'events';
import _kill from 'tree-kill';

import { logger, SpawnTask, SpawnTaskFailed, SpawnTaskStream } from '../../src';
import { TestSpawnTask } from '../utils/task';
import '../utils/logger';

// Mocks
jest.mock('tree-kill');
const kill = _kill as jest.MockedFunction<typeof _kill>;

// Setup
beforeEach(() => {
  jest.resetAllMocks();
});

// Test suites
describe('new SpawnTask', () => {
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
  let proc: EventEmitter;

  beforeEach(() => {
    proc = new EventEmitter();
    jest.spyOn(cp, 'execFile').mockReturnValue(proc as cp.ChildProcess);
  });

  // Tests
  it('should spawn process and mark task as done if it\'s successful', () => {
    const task = new SpawnTask('test', ['arg1', 'arg2'], { cwd: '/test' });
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

  it('should mark task as failed if process fails', () => {
    const task = new SpawnTask('test', ['arg1', 'arg2'], { cwd: '/test' });
    const spy = jest.fn();
    task.on('failed', spy);

    // Start task
    task.start();

    // Complete process
    proc.emit('close', 1, null);

    expect(task.status).toBe('failed');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should mark task as done if process end\'s by signal', () => {
    const task = new SpawnTask('test', ['arg1', 'arg2'], { cwd: '/test' });
    const spy = jest.fn();
    task.on('done', spy);

    // Start task
    task.start();

    // Complete process
    proc.emit('close', null, 'SIGINT');

    expect(task.status).toBe('done');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should log if an error happens', () => {
    jest.spyOn(logger, 'warn');

    // Start task
    const task = new SpawnTask('test', [], { cwd: '/test' });
    task.start();

    // Error !
    proc.emit('error', new Error('Test !'));

    expect(logger.warn).toHaveBeenCalledWith('Error in test: Error: Test !');
  });
});

describe('SpawnTask.stop', () => {
  let proc: EventEmitter;

  beforeEach(() => {
    proc = new EventEmitter();
    (proc as any).pid = -1;

    jest.spyOn(cp, 'execFile').mockReturnValue(proc as cp.ChildProcess);
  });

  // Tests
  it('should kill process and log success or error', async () => {
    // Start a task
    const task = new SpawnTask('test', [], { cwd: '/test' });
    task.start();

    // Stop it
    task.stop();
    expect(kill).toHaveBeenCalledWith(-1, 'SIGTERM', expect.any(Function));

    const cb = kill.mock.calls[0][2]!;

    // Test callback success
    jest.spyOn(logger, 'debug');

    cb();
    expect(logger.debug).toHaveBeenCalledWith('Killed test');

    // Test callback failure
    jest.spyOn(logger, 'warn');

    cb(new Error('Failed !'));
    expect(logger.warn).toHaveBeenCalledWith('Failed to kill test: Error: Failed !');
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