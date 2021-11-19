import { Project } from '@jujulego/jill-core';

import '../../logger';
import { logger } from '../../../src';
import { MyrClient as _MyrClient } from '../../../src/myr/myr-client';
import { stopCommand } from '../../../src/myr/commands/stop';

// Mocks
jest.mock('../../../src/logger');

jest.mock('../../../src/myr/myr-client');
const MyrClient = _MyrClient as jest.MockedClass<typeof _MyrClient>;

// Setup
let prj: Project;

beforeEach(() => {
  jest.resetAllMocks();

  prj = new Project('/prj');

  MyrClient.prototype.stop.mockResolvedValue(true);
});

// Test suites
describe('jill myr stop', () => {
  // Tests
  it('should stop myr and return 0', async () => {
    // Call
    await expect(stopCommand(prj, {}))
      .resolves.toBe(0);

    // Checks
    expect(logger.spin).toHaveBeenCalledWith('Stopping myr');
    expect(MyrClient).toHaveBeenCalledWith(prj);
    expect(MyrClient.prototype.stop).toHaveBeenCalledTimes(1);
    expect(logger.succeed).toHaveBeenCalledWith('myr stopped');
  });

  it('should try to stop myr (already stopped) and return 0', async () => {
    MyrClient.prototype.stop.mockResolvedValue(false); // false means already stopped

    // Call
    await expect(stopCommand(prj, {}))
      .resolves.toBe(0);

    // Checks
    expect(logger.spin).toHaveBeenCalledWith('Stopping myr');
    expect(MyrClient).toHaveBeenCalledWith(prj);
    expect(MyrClient.prototype.stop).toHaveBeenCalledTimes(1);
    expect(logger.stop).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith('myr was not running');
  });
});