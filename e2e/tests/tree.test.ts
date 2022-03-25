import chalk from 'chalk';
import path from 'path';

import { jill, MOCK } from '../utils';

// Tests suites
describe('jill tree', () => {
  it('should tree main workspace data', async () => {
    const res = await jill(['tree'], { cwd: MOCK });

    expect(res.code).toBe(0);
    expect(res.lastFrame).toEqual([
      'mock-root',
      ''
    ]);
  });

  it('should print given workspace data', async () => {
    const res = await jill(['tree', '-w', 'mock-test-a'], { cwd: MOCK });

    expect(res.code).toBe(0);
    expect(res.lastFrame).toEqual([
      chalk`mock-test-a`,
      chalk`├─ mock-test-b`,
      chalk`│  ├─ {blue mock-test-c}`,
      chalk`│  │  {blue └─ }{blue mock-test-d}`,
      chalk`│  └─ {blue mock-test-d}`,
      chalk`└─ {blue mock-test-c}`,
      chalk`   {blue └─ }{blue mock-test-d}`,
      chalk``,
    ]);
  });

  it('should print current workspace data', async () => {
    const res = await jill(['tree'], { cwd: path.join(MOCK, 'workspaces/test-a') });

    expect(res.code).toBe(0);
    expect(res.lastFrame).toEqual([
      chalk`mock-test-a`,
      chalk`├─ mock-test-b`,
      chalk`│  ├─ {blue mock-test-c}`,
      chalk`│  │  {blue └─ }{blue mock-test-d}`,
      chalk`│  └─ {blue mock-test-d}`,
      chalk`└─ {blue mock-test-c}`,
      chalk`   {blue └─ }{blue mock-test-d}`,
      chalk``,
    ]);
  });
});
