import chalk from 'chalk';

import { jill } from './utils';

// Tests
describe('jill tree', () => {
  it('should print workspace dependency tree', async () => {
    const res = await jill(['tree']);

    await expect(res.screen.screen).toEqualLines([
      `@jujulego/jill${chalk.gray('@2.0.1')}`,
    ]);
  });
});
