import * as path from 'path';

import { jill, MOCK } from '../utils';

// Tests suites
describe('jill info', () => {
  it('should print main workspace data', async () => {
    await expect(jill(['info'], { cwd: MOCK })).
      resolves.toMatchSnapshot();
  });

  it('should print given workspace data', async () => {
    await expect(jill(['info', '-w', 'mock-test-a'], { cwd: MOCK })).
      resolves.toMatchSnapshot();
  });

  it('should print current workspace data', async () => {
    await expect(jill(['info'], { cwd: path.join(MOCK, 'workspaces/test-a') })).
      resolves.toMatchSnapshot();
  });
});