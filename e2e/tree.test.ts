import fs from 'node:fs/promises';

import { jill, withPackageManager } from './utils';
import { TestBed } from '@/tools/test-bed';

describe('jill tree', () => void withPackageManager((packageManager) => {
  // Setup
  let prjDir: string;

  beforeEach(async () => {
    const bed = new TestBed();

    const wksC = bed.addWorkspace('wks-c');
    const wksB = bed.addWorkspace('wks-b')
      .addDependency(wksC, true);
    bed.addWorkspace('wks-a')
      .addDependency(wksB)
      .addDependency(wksC, true);

    prjDir = await bed.createProjectPackage(packageManager);
  }, 15000);

  afterEach(async () => {
    await fs.rm(prjDir, { recursive: true });
  });

  // Tests
  it('should print current workspace dependency tree', async () => {
    const res = await jill('tree', { cwd: prjDir });

    await expect(res.screen.screen).toEqualLines([
      expect.ignoreColor('main@1.0.0'),
    ]);
  });

  it('should print given workspace dependency tree', async () => {
    const res = await jill('tree -w wks-a', { cwd: prjDir });

    await expect(res.screen.screen).toEqualLines([
      expect.ignoreColor('wks-a@1.0.0'),
      expect.ignoreColor('├─ wks-b@1.0.0'),
      expect.ignoreColor('│  └─ wks-c@1.0.0'),
      expect.ignoreColor('└─ wks-c@1.0.0'),
    ]);
  });
}), { timeout: 10000 });
