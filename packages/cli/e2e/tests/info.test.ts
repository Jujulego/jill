import chalk from 'chalk';
import path from 'path';

import { jill, MOCK } from '../utils';

// Setup
chalk.level = 1;

// Tests suites
describe('jill info', () => {
  it('should print main workspace data', async () => {
    await expect(jill(['info'], { cwd: MOCK }))
      .resolves.toEqual({
        code: 0,
        stderr: [
          "- Loading project"
        ],
        stdout: [
          chalk`Workspace {bold mock-root}:`,
          chalk`{bold Version:}   undefined`,
          chalk`{bold Directory:} .`,
        ]
      });
  });

  it('should print given workspace data', async () => {
    await expect(jill(['info', '-w', 'mock-test-a'], { cwd: MOCK }))
      .resolves.toEqual({
        code: 0,
        stderr: [
          "- Loading project"
        ],
        stdout: [
          chalk`Workspace {bold mock-test-a}:`,
          chalk`{bold Version:}   undefined`,
          chalk`{bold Directory:} workspaces${path.sep}test-a`,
          chalk``,
          chalk`{bold Dependencies:}`,
          chalk`- mock-test-b`,
          chalk``,
          chalk`{bold Dev-Dependencies:}`,
          chalk`- mock-test-c`,
        ]
      });
  });

  it('should print current workspace data', async () => {
    await expect(jill(['info'], { cwd: path.join(MOCK, 'workspaces/test-a') }))
      .resolves.toEqual({
        code: 0,
        stderr: [
          "- Loading project"
        ],
        stdout: [
          chalk`Workspace {bold mock-test-a}:`,
          chalk`{bold Version:}   undefined`,
          chalk`{bold Directory:} .`,
          chalk``,
          chalk`{bold Dependencies:}`,
          chalk`- mock-test-b`,
          chalk``,
          chalk`{bold Dev-Dependencies:}`,
          chalk`- mock-test-c`,
        ]
      });
  });
});