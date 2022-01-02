import { ProjectArgs } from '@jujulego/jill-common';
import { Project } from '@jujulego/jill-core';

import { MyrClient as _MyrClient } from '../../src/myr-client';
import { StopCommand } from '../../src/commands/stop.command';
import { TestArgs, TestBed } from '../test-bed';
import '../logger';

// Mocks
jest.mock('../../src/myr-client');
const MyrClient = _MyrClient as jest.MockedClass<typeof _MyrClient>;

// Setup
let prj: Project;
let testBed: TestBed<ProjectArgs, StopCommand>;

const defaults: TestArgs<ProjectArgs> = {
  verbose: 0,
  plugins: [],
  project: '/project',
  'package-manager': undefined
};

beforeEach(() => {
  prj = new Project('/prj');
  testBed = new TestBed(new StopCommand());

  jest.resetAllMocks();
  jest.restoreAllMocks();

  jest.spyOn(testBed.command, 'project', 'get').mockReturnValue(prj);
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
