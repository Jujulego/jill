import fs from 'node:fs/promises';
import path from 'node:path';

import '@/src/commons/logger.service.js';
import { TestBed } from '@/tools/test-bed.js';
import { shell } from '@/tools/utils.js';

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
describe('jill list', () => {
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
    it('should print a list of all workspaces', async () => {
      const res = await jill('list', { cwd: prjDir });

      expect(res.code).toBe(0);
      expect(res.screen.screen).toEqualLines([
        'main',
        'wks-a',
        'wks-b',
        'wks-c'
      ]);
    });

    it('should print a long list of all workspaces', async () => {
      const res = await jill('list -l', { cwd: prjDir });

      expect(res.code).toBe(0);
      expect(res.screen.screen).toEqualLines([
        expect.ignoreColor('Name   Version  Root'),
        expect.ignoreColor('main   1.0.0    .'),
        expect.ignoreColor('wks-a  1.0.0    wks-a'),
        expect.ignoreColor('wks-b  1.0.0    wks-b'),
        expect.ignoreColor('wks-c  1.0.0    wks-c'),
      ]);
    });

    it('should print a list of all workspaces in json', async () => {
      const res = await jill('list --json', { cwd: prjDir });

      expect(res.code).toBe(0);

      expect(res.stdout.join('\n')).toEqual(expect.jsonMatching([
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
      ]));
    });

    describe('affected filter (--affected)', () => {
      beforeEach(async () => {
        await shell('git init', { cwd: prjDir });
        await shell('git add .', { cwd: prjDir });
        await shell('git commit -m "initial commit"', { cwd: prjDir });
      });

      it('should list affected workspaces', async () => {
        // Create a file in a branch
        await shell('git checkout -b test', { cwd: prjDir });
        await fs.writeFile(path.resolve(prjDir, 'wks-a/toto.txt'), 'toto');
        await shell('git add .', { cwd: prjDir });

        // Run jill
        const res = await jill('list --affected', { cwd: prjDir });

        expect(res.code).toBe(0);
        expect(res.screen.screen).toEqualLines([
          'main',
          'wks-a'
        ]);
      });

      it('should also list indirectly affected workspaces', async () => {
        // Create a file in a branch
        await shell('git checkout -b test', { cwd: prjDir });
        await fs.writeFile(path.resolve(prjDir, 'wks-b/toto.txt'), 'toto');
        await shell('git add .', { cwd: prjDir });

        // Run jill
        const res = await jill('list --affected', { cwd: prjDir });

        expect(res.code).toBe(0);
        expect(res.screen.screen).toEqualLines([
          'main',
          'wks-a',
          'wks-b'
        ]);
      });
    });
  });
}, { timeout: 10000 });
