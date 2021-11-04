import { promises as fs } from 'fs';
import { lock as _lock } from 'proper-lockfile';

import { PidFile } from '../src/pidfile';

// Mocks
jest.mock('proper-lockfile');
const lock = _lock as jest.MockedFunction<typeof _lock>;

// Setup
beforeEach(() => {
  jest.resetAllMocks();
});

// Test suites
describe('PidFile.create', () => {
  beforeEach(() => {
    jest.spyOn(fs, 'writeFile')
      .mockRejectedValue({ message: 'Failed !', code: 'EEXIST' });
  });

  // Tests
  it('should create pidfile and return true', async () => {
    jest.spyOn(fs, 'writeFile').mockImplementation();

    // Test
    const pidfile = new PidFile();
    await expect(pidfile.create()).resolves.toBe(true);

    expect(fs.writeFile).toHaveBeenCalledWith('.jill-lutin.pid', process.pid.toString(), { flag: 'wx', encoding: 'utf-8' });
  });

  it('should fail to create pidfile and try to update it', async () => {
    const pidfile = new PidFile();
    jest.spyOn(pidfile, 'update').mockResolvedValue(true);

    // Test
    await expect(pidfile.create()).resolves.toBe(true);

    expect(pidfile.update).toHaveBeenCalled();
  });

  it('should fail to create pidfile and return false', async () => {
    jest.spyOn(fs, 'writeFile').mockRejectedValue(new Error('Failed !'));

    // Test
    const pidfile = new PidFile();
    await expect(pidfile.create()).resolves.toBe(false);
  });
});

describe('PidFile.update', () => {
  let lockRelease: jest.Mock;

  beforeEach(() => {
    jest.spyOn(fs, 'readFile').mockResolvedValue('-10');
    jest.spyOn(fs, 'writeFile').mockImplementation();

    jest.spyOn(process, 'kill').mockImplementation(() => {
      throw new Error('Process not found');
    });

    lockRelease = jest.fn();
    lock.mockResolvedValue(lockRelease);
  });

  // Tests
  it('should update pidfile as process is not running', async () => {
    // Test
    const pidfile = new PidFile();
    await expect(pidfile.update()).resolves.toBe(true);

    expect(fs.readFile).toHaveBeenCalledWith('.jill-lutin.pid', 'utf-8');
    expect(process.kill).toHaveBeenCalledWith(-10, 0);
    expect(lock).toHaveBeenCalledWith('.jill-lutin.pid');
    expect(fs.writeFile).toHaveBeenCalledWith('.jill-lutin.pid', process.pid.toString(), { flag: 'w', encoding: 'utf-8' });
    expect(lockRelease).toHaveBeenCalled();
  });

  it('should not update pidfile as process is still running', async () => {
    jest.spyOn(process, 'kill').mockImplementation();

    // Test
    const pidfile = new PidFile();
    await expect(pidfile.update()).resolves.toBe(false);

    expect(lock).not.toHaveBeenCalled();
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('should fail to update pidfile', async () => {
    jest.spyOn(fs, 'writeFile').mockRejectedValue(new Error('Failed !'));

    // Test
    const pidfile = new PidFile();
    await expect(pidfile.update()).resolves.toBe(false);

    expect(lock).toHaveBeenCalledWith('.jill-lutin.pid');
    expect(lockRelease).toHaveBeenCalled();
  });
});

describe('PidFile.delete', () => {
  // Tests
  it('should delete pidfile', async () => {
    jest.spyOn(fs, 'unlink').mockResolvedValue();

    // Test
    const pidfile = new PidFile();
    await expect(pidfile.delete()).resolves.toBeUndefined();

    expect(fs.unlink).toHaveBeenCalledWith('.jill-lutin.pid');
  });
});