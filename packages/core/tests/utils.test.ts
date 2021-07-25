import cp from 'child_process';
import { EventEmitter } from 'events';
import { Readable } from 'stream';

import { spawn } from '../src/utils';

import './logger';

// Test suites
describe('spawn', () => {
  let proc: cp.ChildProcess;

  beforeEach(() => {
    proc = new EventEmitter() as cp.ChildProcess;
    proc.stdout = new EventEmitter() as Readable;
    proc.stderr = new EventEmitter() as Readable;

    jest.spyOn(cp, 'spawn')
      .mockReturnValue(proc);
  });

  // Tests
  it('should return all lines send by the process', async () => {
    const sp = spawn('test', ['arg1', 'arg2']);

    proc.stdout!.emit('data', Buffer.from('test'));
    proc.stderr!.emit('data', Buffer.from('error'));

    proc.emit('close', 0);

    // Checks
    await expect(sp).resolves.toEqual({
      stdout: ['test'],
      stderr: ['error'],
    });

    expect(cp.spawn).toHaveBeenCalledWith('test', ['arg1', 'arg2'], expect.objectContaining({
      shell: true,
      stdio: 'pipe',
    }));
  });

  it('should throw error with last line of stderr', async () => {
    const sp = spawn('test', ['arg1', 'arg2']);

    proc.stderr!.emit('data', Buffer.from('error'));

    proc.emit('close', 1);

    // Checks
    await expect(sp).rejects.toEqual(new Error('error'));
  });

  it('should throw error with default message', async () => {
    const sp = spawn('test', ['arg1', 'arg2']);

    proc.emit('close', 1);

    // Checks
    await expect(sp).rejects.toEqual(new Error('test arg1 arg2 failed'));
  });
});
