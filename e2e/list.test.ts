import fs from 'node:fs/promises';

import { jill } from './utils';
import { TestBed } from '../tools/test-bed';

// Setup
let prjDir: string;

beforeEach(async () => {
  const bed = new TestBed();

  bed.addWorkspace('wks-a');
  bed.addWorkspace('wks-b');
  bed.addWorkspace('wks-c');

  prjDir = await bed.createProjectDirectory();
});

afterEach(async () => {
  await fs.rm(prjDir, { recursive: true });
});

// Tests
describe('jill list', () => {
  it('should print list of all workspaces', async () => {
    const res = await jill(['list'], { cwd: prjDir });

    await expect(res.screen.screen).toEqualLines([
      'main',
      'wks-a',
      'wks-b',
      'wks-c'
    ]);
  });

  it('should print long list of all workspaces', async () => {
    const res = await jill(['list', '-l'], { cwd: prjDir });

    await expect(res.screen.screen).toEqualLines([
      expect.ignoreColor('Name   Version  Root'),
      expect.ignoreColor('main   1.0.0    .'),
      expect.ignoreColor('wks-a  1.0.0    wks-a'),
      expect.ignoreColor('wks-b  1.0.0    wks-b'),
      expect.ignoreColor('wks-c  1.0.0    wks-c'),
    ]);
  });
});
