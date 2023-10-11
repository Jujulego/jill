import fs from 'node:fs/promises';
import path from 'node:path';

import { TestBed } from '@/tools/test-bed.js';

import { jill } from './utils.js';

// Setup
const bed = new TestBed();

beforeAll(() => {
  const wksC = bed.addWorkspace('wks-c');
  const wksB = bed.addWorkspace('wks-b')
    .addDependency(wksC, true);

  bed.addWorkspace('wks-a')
    .addDependency(wksB)
    .addDependency(wksC, true);
});

// Tests
describe('jill tree', () => {
  describe.each(['npm', 'yarn'] as const)('using %s', (packageManager) => {
    // Setup
    let baseDir: string;
    let tmpDir: string;
    let prjDir: string;

    beforeAll(async () => {
      baseDir = await bed.createProjectPackage(packageManager);
      tmpDir = path.dirname(baseDir);
    }, 15000);

    beforeEach(async (ctx) => {
      prjDir = path.join(tmpDir, ctx.task.id);

      await fs.cp(baseDir, prjDir, { force: true, recursive: true });
    });

    afterAll(async () => {
      await fs.rm(tmpDir, { recursive: true });
    });

    // Tests
    it('should print current workspace dependency tree', async () => {
      const res = await jill('tree', { cwd: prjDir });

      expect(res.screen.screen).toEqualLines([
        expect.ignoreColor('main@1.0.0'),
      ]);
    });

    it('should print given workspace dependency tree', async () => {
      const res = await jill('tree -w wks-a', { cwd: prjDir });

      expect(res.screen.screen).toEqualLines([
        expect.ignoreColor('wks-a@1.0.0'),
        expect.ignoreColor('├─ wks-b@1.0.0'),
        expect.ignoreColor('│  └─ wks-c@1.0.0'),
        expect.ignoreColor('└─ wks-c@1.0.0'),
      ]);
    });
  });
}, { timeout: 10000 });
