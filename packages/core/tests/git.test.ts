import { git, TaskManager } from '../src';
import './utils/logger';

// Setup
const manager = new TaskManager();

beforeEach(() => {
  jest.resetAllMocks();

  // Mocks
  jest.spyOn(TaskManager, 'global', 'get')
    .mockReturnValue(manager);

  jest.spyOn(manager, 'add').mockImplementation();
});

// Test suites
describe('git.diff', () => {
  it('should create task and add it to global manager', async () => {
    const task = git.diff(['arg1', 'arg2']);
    expect(manager.add).toHaveBeenCalledWith(task);

    expect(task.cmd).toBe('git');
    expect(task.args).toEqual(['diff', 'arg1', 'arg2']);
  });

  it('should create task and add it to given manager', async () => {
    const mng = new TaskManager();
    jest.spyOn(mng, 'add').mockImplementation();

    const task = git.diff(['arg1', 'arg2'], { manager: mng });
    expect(mng.add).toHaveBeenCalledWith(task);

    expect(task.cmd).toBe('git');
    expect(task.args).toEqual(['diff', 'arg1', 'arg2']);
  });
});