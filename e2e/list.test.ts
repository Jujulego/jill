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
  it('should print list all workspaces', async () => {
    const res = await jill(['list'], { cwd: prjDir });

    await expect(res.screen.screen).toEqualLines([
      'main',
      'wks-a',
      'wks-b',
      'wks-c'
    ]);
  });
});
