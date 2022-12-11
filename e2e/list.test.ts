import fs from 'node:fs/promises';
import path from 'path';

import { jill } from './utils';
import { TestBed } from '@/tools/test-bed';

// Setup
let prjDir: string;

beforeEach(async () => {
  const bed = new TestBed();

  bed.addWorkspace('wks-a');
  bed.addWorkspace('wks-b');
  bed.addWorkspace('wks-c');

  prjDir = await bed.createProjectPackage();
});

afterEach(async () => {
  await fs.rm(prjDir, { recursive: true });
});

// Tests
describe('jill list', () => {
  it('should print a list of all workspaces', async () => {
    const res = await jill(['list'], { cwd: prjDir });

    await expect(res.screen.screen).toEqualLines([
      'main',
      'wks-a',
      'wks-b',
      'wks-c'
    ]);
  });

  it('should print a long list of all workspaces', async () => {
    const res = await jill(['list', '-l'], { cwd: prjDir });

    await expect(res.screen.screen).toEqualLines([
      expect.ignoreColor('Name   Version  Root'),
      expect.ignoreColor('main   1.0.0    .'),
      expect.ignoreColor('wks-a  1.0.0    wks-a'),
      expect.ignoreColor('wks-b  1.0.0    wks-b'),
      expect.ignoreColor('wks-c  1.0.0    wks-c'),
    ]);
  });

  it('should print a list of all workspaces in json', async () => {
    const res = await jill(['list', '--json'], { cwd: prjDir });

    await expect(res.stdout).toEqual([
      expect.jsonMatching([
        {
          name: 'main',
          version: '1.0.0',
          slug: 'main',
          root: prjDir,
        },
        {
          name: 'wks-a',
          version: '1.0.0',
          slug: 'wks-a',
          root: path.join(prjDir, 'wks-a'),
        },
        {
          name: 'wks-b',
          version: '1.0.0',
          slug: 'wks-b',
          root: path.join(prjDir, 'wks-b'),
        },
        {
          name: 'wks-c',
          version: '1.0.0',
          slug: 'wks-c',
          root: path.join(prjDir, 'wks-c'),
        },
      ])
    ]);
  });
});
