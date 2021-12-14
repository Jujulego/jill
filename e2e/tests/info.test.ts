import chalk from 'chalk';
import path from 'path';

import { jill, MOCK } from '../utils';

// Tests suites
describe('jill info', () => {
  it('should print main workspace data', async () => {
    await expect(jill(['info'], { cwd: MOCK }))
      .resolves.toEqual({
        code: 0,
        stderr: [
          '- Loading project',
          '- Loading "." workspace'
        ],
        stdout: [
          chalk`Workspace {bold mock-root}:`,
          chalk`{bold Version:}   {grey unset}`,
          chalk`{bold Directory:} .`,
          chalk``,
          chalk`{bold Dependencies:}`,
          chalk`{grey    No dependencies for mock-root}`,
        ]
      });
  });

  it('should print given workspace data', async () => {
    await expect(jill(['info', '-w', 'mock-test-a'], { cwd: MOCK }))
      .resolves.toEqual({
        code: 0,
        stderr: [
          '- Loading project',
          '- Loading "mock-test-a" workspace'
        ],
        stdout: [
          chalk`Workspace {bold mock-test-a}:`,
          chalk`{bold Version:}   {grey unset}`,
          chalk`{bold Directory:} workspaces${path.sep}test-a`,
          chalk``,
          chalk`{bold Dependencies:}`,
          chalk`├─ mock-test-b`,
          chalk`│  ├─ {blue mock-test-c (dev)}`,
          chalk`│  │  {blue └─ }{blue mock-test-d (dev)}`,
          chalk`│  └─ {italic.blue mock-test-d (dev)}`,
          chalk`└─ {italic.blue mock-test-c (dev)}`,
        ]
      });
  });

  it('should print current workspace data', async () => {
    await expect(jill(['info'], { cwd: path.join(MOCK, 'workspaces/test-a') }))
      .resolves.toEqual({
        code: 0,
        stderr: [
          '- Loading project',
          '- Loading "." workspace'
        ],
        stdout: [
          chalk`Workspace {bold mock-test-a}:`,
          chalk`{bold Version:}   {grey unset}`,
          chalk`{bold Directory:} .`,
          chalk``,
          chalk`{bold Dependencies:}`,
          chalk`├─ mock-test-b`,
          chalk`│  ├─ {blue mock-test-c (dev)}`,
          chalk`│  │  {blue └─ }{blue mock-test-d (dev)}`,
          chalk`│  └─ {italic.blue mock-test-d (dev)}`,
          chalk`└─ {italic.blue mock-test-c (dev)}`,
        ]
      });
  });
});