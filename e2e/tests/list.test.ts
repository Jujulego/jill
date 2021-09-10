import chalk from 'chalk';
import path from 'path';

import { jill, MOCK } from '../utils';

// Tests suites
describe('jill list', () => {
  it('should print list of all projects', async () => {
    await expect(jill(['list'], { cwd: MOCK }))
      .resolves.toEqual({
        code: 0,
        stderr: [
          '- Loading project'
        ],
        stdout: [
          chalk`mock-root  `,
          chalk`mock-test-a`,
          chalk`mock-test-b`,
          chalk`mock-test-c`,
          chalk`mock-test-d`,
        ]
      });
  });

  it('should print list of all private projects (--private)', async () => {
    await expect(jill(['list', '--private'], { cwd: MOCK }))
      .resolves.toEqual({
        code: 0,
        stderr: [
          '- Loading project'
        ],
        stdout: [
          chalk`mock-root`,
        ]
      });
  });

  it('should print list of all public projects (--no-private)', async () => {
    await expect(jill(['list', '--no-private'], { cwd: MOCK }))
      .resolves.toEqual({
        code: 0,
        stderr: [
          '- Loading project'
        ],
        stdout: [
          chalk`mock-test-a`,
          chalk`mock-test-b`,
          chalk`mock-test-c`,
          chalk`mock-test-d`,
        ]
      });
  });

  it('should print list of all public projects (--with-script start)', async () => {
    await expect(jill(['list', '--with-script', 'start'], { cwd: MOCK }))
      .resolves.toEqual({
        code: 0,
        stderr: [
          '- Loading project'
        ],
        stdout: [
          chalk`mock-test-a`,
        ]
      });
  });

  it('should print name and version of all projects (--attrs name version)', async () => {
    await expect(jill(['list', '--attrs', 'name', 'version'], { cwd: MOCK }))
      .resolves.toEqual({
        code: 0,
        stderr: [
          '- Loading project'
        ],
        stdout: [
          chalk`{bold Name       }  {bold Version}`,
          chalk`mock-root    {grey unset}  `,
          chalk`mock-test-a  {grey unset}  `,
          chalk`mock-test-b  {grey unset}  `,
          chalk`mock-test-c  {grey unset}  `,
          chalk`mock-test-d  {grey unset}  `,
        ]
      });
  });

  it('should print list of all projects with headers (--headers)', async () => {
    await expect(jill(['list', '--headers'], { cwd: MOCK }))
      .resolves.toEqual({
        code: 0,
        stderr: [
          '- Loading project'
        ],
        stdout: [
          chalk`{bold Name       }`,
          chalk`mock-root  `,
          chalk`mock-test-a`,
          chalk`mock-test-b`,
          chalk`mock-test-c`,
          chalk`mock-test-d`,
        ]
      });
  });

  it('should print list of all projects in long format (-l)', async () => {
    await expect(jill(['list', '-l'], { cwd: MOCK }))
      .resolves.toEqual({
        code: 0,
        stderr: [
          '- Loading project'
        ],
        stdout: [
          chalk`{bold Name       }  {bold Version}  {bold Root             }`,
          chalk`mock-root    {grey unset}    .                `,
          chalk`mock-test-a  {grey unset}    workspaces${path.sep}test-a`,
          chalk`mock-test-b  {grey unset}    workspaces${path.sep}test-b`,
          chalk`mock-test-c  {grey unset}    workspaces${path.sep}test-c`,
          chalk`mock-test-d  {grey unset}    workspaces${path.sep}test-d`,
        ]
      });
  });

  it('should print list of all projects in json format (--json)', async () => {
    const result = await jill(['list', '--json'], { cwd: MOCK });

    expect(result.code).toBe(0);
    expect(result.stderr).toEqual([
      '- Loading project'
    ]);

    expect(JSON.parse(result.stdout.join('\n'))).toEqual([
      {
        name: 'mock-root',
        version: undefined,
        slug: 'mock-root',
        root: MOCK,
      },
      {
        name: 'mock-test-a',
        version: undefined,
        slug: 'mock-test-a',
        root: path.join(MOCK, 'workspaces', 'test-a'),
      },
      {
        name: 'mock-test-b',
        version: undefined,
        slug: 'mock-test-b',
        root: path.join(MOCK, 'workspaces', 'test-b'),
      },
      {
        name: 'mock-test-c',
        version: undefined,
        slug: 'mock-test-c',
        root: path.join(MOCK, 'workspaces', 'test-c'),
      },
      {
        name: 'mock-test-d',
        version: undefined,
        slug: 'mock-test-d',
        root: path.join(MOCK, 'workspaces', 'test-d'),
      },
    ]);
  });
});