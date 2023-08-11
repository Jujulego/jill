import fs from 'node:fs/promises';
import path from 'path';

import { TestBed } from '@/tools/test-bed';
import { shell } from '@/tools/utils';

import { jill } from './utils';

describe('jill list', () => {
  describe.each(['npm', 'yarn'] as const)('using %s', (packageManager) => {
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
    it('should print a list of all workspaces', async () => {
      const res = await jill('list', { cwd: prjDir });

      expect(res.code).toBe(0);
      expect(res.screen.screen).toEqualLines([
        'main',
        'wks-c',
        'wks-b',
        'wks-a'
      ]);
    });

    it('should print a long list of all workspaces', async () => {
      const res = await jill('list -l', { cwd: prjDir });

      expect(res.code).toBe(0);
      expect(res.screen.screen).toEqualLines([
        expect.ignoreColor('Name   Version  Root'),
        expect.ignoreColor('main   1.0.0    .'),
        expect.ignoreColor('wks-c  1.0.0    wks-c'),
        expect.ignoreColor('wks-b  1.0.0    wks-b'),
        expect.ignoreColor('wks-a  1.0.0    wks-a'),
      ]);
    });

    it('should print a list of all workspaces in json', async () => {
      const res = await jill('list --json', { cwd: prjDir });

      expect(res.code).toBe(0);
      expect(res.stdout).toEqual([
        expect.jsonMatching([
          {
            name: 'main',
            version: '1.0.0',
            slug: 'main',
            root: prjDir,
          },
          {
            name: 'wks-c',
            version: '1.0.0',
            slug: 'wks-c',
            root: path.join(prjDir, 'wks-c'),
          },
          {
            name: 'wks-b',
            version: '1.0.0',
            slug: 'wks-b',
            root: path.join(prjDir, 'wks-b'),
          },
          {
            name: 'wks-a',
            version: '1.0.0',
            slug: 'wks-a',
            root: path.join(prjDir, 'wks-a'),
          },
        ])
      ]);
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
          'wks-b',
          'wks-a'
        ]);
      });
    });
  });
}, { timeout: 10000 });
