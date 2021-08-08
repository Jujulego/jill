import { jill, MOCK } from '../utils';

// Tests suites
describe('jill info', () => {
  it('should print main workspace data', async () => {
    await expect(jill(['info'], { cwd: MOCK })).
      resolves.toMatchSnapshot();
  });
});