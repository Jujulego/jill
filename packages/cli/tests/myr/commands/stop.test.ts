import { Project } from '@jujulego/jill-core';

import '../../logger';
import { MyrClient as _MyrClient } from '../../../src/myr/myr-client';
import { StopCommand } from '../../../src/myr/commands/stop.command';
import { TestBed, TestCommand } from '../../test-bed';

// Mocks
jest.mock('../../../src/myr/myr-client');
const MyrClient = _MyrClient as jest.MockedClass<typeof _MyrClient>;

// Setup
let prj: Project;

const TestStopCommand = TestCommand(StopCommand);
const testBed = new TestBed(TestStopCommand);
const defaults = {
  '$0': 'jill',
  _: [],
  verbose: 0,
  project: '/project',
  'package-manager': undefined
};

beforeEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();

  prj = new Project('/prj');

  testBed.beforeEach();
  jest.spyOn(testBed.cmd, 'project', 'get').mockReturnValue(prj);

  MyrClient.prototype.stop.mockResolvedValue(true);
});

// Test suites
describe('jill myr stop', () => {
  // Tests
  it('should stop myr and return 0', async () => {
    // Call
    await expect(testBed.run(defaults))
      .resolves.toBeUndefined();

    // Checks
    expect(testBed.spinner.start).toHaveBeenCalledWith('Stopping myr');
    expect(MyrClient).toHaveBeenCalledWith(prj);
    expect(MyrClient.prototype.stop).toHaveBeenCalledTimes(1);
    expect(testBed.spinner.succeed).toHaveBeenCalledWith('myr stopped');
  });

  it('should try to stop myr (already stopped) and return 0', async () => {
    MyrClient.prototype.stop.mockResolvedValue(false); // false means already stopped

    // Call
    await expect(testBed.run(defaults))
      .resolves.toBeUndefined();

    // Checks
    expect(testBed.spinner.start).toHaveBeenCalledWith('Stopping myr');
    expect(MyrClient).toHaveBeenCalledWith(prj);
    expect(MyrClient.prototype.stop).toHaveBeenCalledTimes(1);
    expect(testBed.spinner.stop).toHaveBeenCalledTimes(1);
    expect(testBed.logger.warn).toHaveBeenCalledWith('myr was not running');
  });
});