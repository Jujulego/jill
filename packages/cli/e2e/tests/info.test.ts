import { jill, MOCK } from '../utils';
import chalk from 'chalk';

// Setup
chalk.level = 1;

// Tests suites
describe('jill info', () => {
  it('should print main workspace data', async () => {
    await expect(jill(['info'], { cwd: MOCK })).
      resolves.toMatchSnapshot();
  });
});