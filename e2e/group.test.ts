import fs from 'node:fs/promises';
import path from 'node:path';

import { TestBed } from '@/tools/test-bed.js';
import { fileExists } from '@/tools/utils.js';

import { jill } from './utils.js';

describe('jill group', () => {
  describe.each(['npm', 'yarn'] as const)('using %s', (packageManager) => {
    // Setup
    let prjDir: string;

    beforeEach(async () => {
      const bed = new TestBed();

      const wksC = bed.addWorkspace('wks-c', {
        scripts: {
          // language=bash
          build: 'node -e "require(\'node:fs\').writeFileSync(\'script.txt\', \'build\')"',
          // language=bash
          test1: 'node -e "require(\'node:fs\').writeFileSync(\'script.txt\', \'test1\')"',
          // language=bash
          test2: 'node -e "require(\'node:fs\').writeFileSync(\'script.txt\', \'test2\')"',
          // language=bash
          fails: 'node -e "process.exit(1)"',
        }
      });
      const wksB = bed.addWorkspace('wks-b', {
        scripts: {
          // language=bash
          test1: 'node -e "require(\'node:fs\').writeFileSync(\'script.txt\', \'test1\')"',
          // language=bash
          test2: 'node -e "require(\'node:fs\').writeFileSync(\'script.txt\', \'test2\')"',
        }
      })
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
    describe('parallel group', () => {
      it('should run wks-c both test1 and test2 scripts in parallel', async () => {
        const res = await jill('group -w wks-c "test1 // test2"', { cwd: prjDir });

        // Check jill output
        expect(res.code).toBe(0);

        expect(res.screen.screen).toMatchLines([
          expect.ignoreColor(/^. In parallel \(took [0-9.]+m?s\)$/),
          expect.ignoreColor(/^ {2}. Running test1 in wks-c \(took [0-9.]+m?s\)$/),
          expect.ignoreColor(/^ {2}. Running test2 in wks-c \(took [0-9.]+m?s\)$/),
        ]);

        // Check script result
        await expect(fs.readFile(path.join(prjDir, 'wks-c', 'script.txt'), 'utf8'))
          .resolves.toMatch(/test[12]/);
      });

      it('should run wks-c both test1 and fails scripts in parallel and exit 1', async () => {
        const res = await jill('group -w wks-c "test1 // fails"', { cwd: prjDir });

        // Check jill output
        expect(res.code).toBe(1);

        expect(res.screen.screen).toMatchLines([
          expect.ignoreColor(/^. In parallel \(took [0-9.]+m?s\)$/),
          expect.ignoreColor(/^ {2}. Running test1 in wks-c \(took [0-9.]+m?s\)$/),
          expect.ignoreColor(/^ {2}. Running fails in wks-c \(took [0-9.]+m?s\)$/),
          expect.ignoreColor(/^ {4}.( yarn exec)? node -e "process.exit\(1\)" \(took [0-9.]+m?s\)$/),
        ]);

        // Check script result
        await expect(fs.readFile(path.join(prjDir, 'wks-c', 'script.txt'), 'utf8'))
          .resolves.toBe('test1');
      });

      it('should run wks-c build then run wks-b both test1 and test2 scripts in parallel', async () => {
        const res = await jill('group -w wks-b "test1 // test2"', { cwd: prjDir });

        // Check jill output
        expect(res.code).toBe(0);

        expect(res.screen.screen).toMatchLines([
          expect.ignoreColor(/^. Running build in wks-c \(took [0-9.]+m?s\)$/),
          expect.ignoreColor(/^. In parallel \(took [0-9.]+m?s\)$/),
          expect.ignoreColor(/^ {2}. Running test1 in wks-b \(took [0-9.]+m?s\)$/),
          expect.ignoreColor(/^ {2}. Running test2 in wks-b \(took [0-9.]+m?s\)$/),
        ]);

        // Check script result
        await expect(fs.readFile(path.join(prjDir, 'wks-c', 'script.txt'), 'utf8'))
          .resolves.toBe('build');

        await expect(fs.readFile(path.join(prjDir, 'wks-b', 'script.txt'), 'utf8'))
          .resolves.toMatch(/test[12]/);
      });
    });

    describe('sequence group', () => {
      it('should run wks-c both test1 and test2 scripts in sequence', async () => {
        const res = await jill('group -w wks-c "test1 -> test2"', { cwd: prjDir });

        // Check jill output
        expect(res.code).toBe(0);

        expect(res.screen.screen).toMatchLines([
          expect.ignoreColor(/^. In sequence \(took [0-9.]+m?s\)$/),
          expect.ignoreColor(/^ {2}. Running test1 in wks-c \(took [0-9.]+m?s\)$/),
          expect.ignoreColor(/^ {2}. Running test2 in wks-c \(took [0-9.]+m?s\)$/),
        ]);

        // Check script result
        await expect(fs.readFile(path.join(prjDir, 'wks-c', 'script.txt'), 'utf8'))
          .resolves.toBe('test2');
      });

      it('should run wks-c both test1 and fails scripts in sequence and exit 1', async () => {
        const res = await jill('group -w wks-c "test1 -> fails"', { cwd: prjDir });

        // Check jill output
        expect(res.code).toBe(1);

        expect(res.screen.screen).toMatchLines([
          expect.ignoreColor(/^. In sequence \(took [0-9.]+m?s\)$/),
          expect.ignoreColor(/^ {2}. Running test1 in wks-c \(took [0-9.]+m?s\)$/),
          expect.ignoreColor(/^ {2}. Running fails in wks-c \(took [0-9.]+m?s\)$/),
          expect.ignoreColor(/^ {4}.( yarn exec)? node -e "process.exit\(1\)" \(took [0-9.]+m?s\)$/),
        ]);

        // Check script result
        await expect(fs.readFile(path.join(prjDir, 'wks-c', 'script.txt'), 'utf8'))
          .resolves.toBe('test1');
      });

      it('should run wks-c build then run wks-b both test1 and test2 scripts in sequence', async () => {
        const res = await jill('group -w wks-b "test1 -> test2"', { cwd: prjDir });

        // Check jill output
        expect(res.code).toBe(0);

        expect(res.screen.screen).toMatchLines([
          expect.ignoreColor(/^. Running build in wks-c \(took [0-9.]+m?s\)$/),
          expect.ignoreColor(/^. In sequence \(took [0-9.]+m?s\)$/),
          expect.ignoreColor(/^ {2}. Running test1 in wks-b \(took [0-9.]+m?s\)$/),
          expect.ignoreColor(/^ {2}. Running test2 in wks-b \(took [0-9.]+m?s\)$/),
        ]);

        // Check script result
        await expect(fs.readFile(path.join(prjDir, 'wks-c', 'script.txt'), 'utf8'))
          .resolves.toBe('build');

        await expect(fs.readFile(path.join(prjDir, 'wks-b', 'script.txt'), 'utf8'))
          .resolves.toBe('test2');
      });
    });

    it('should print task plan and do not run any script', async () => {
      const res = await jill('group -w wks-c --plan --plan-mode json "test1 -> test2"', { cwd: prjDir });

      // Check jill output
      expect(res.code).toBe(0);
      expect(res.stdout).toHaveLength(1);

      const plan = JSON.parse(res.stdout[0]);
      expect(plan).toHaveLength(5);

      expect(plan[0]).toMatchObject({
        id: expect.stringMatching(/[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}/),
        isGroup: true,
        context: {}
      });

      expect(plan[1]).toMatchObject({
        id: expect.stringMatching(/[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}/),
        isGroup: true,
        groupId: plan[0].id,
        context: {
          script: 'test1',
          workspace: {
            name: 'wks-c',
            cwd: path.join(prjDir, 'wks-c')
          }
        }
      });

      expect(plan[2]).toMatchObject({
        id: expect.stringMatching(/[0-9a-f]{32}/),
        groupId: plan[1].id,
        context: {
          command: 'node',
          workspace: {
            name: 'wks-c',
            cwd: path.join(prjDir, 'wks-c')
          }
        }
      });

      expect(plan[3]).toMatchObject({
        id: expect.stringMatching(/[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}/),
        isGroup: true,
        groupId: plan[0].id,
        context: {
          script: 'test2',
          workspace: {
            name: 'wks-c',
            cwd: path.join(prjDir, 'wks-c')
          }
        }
      });

      expect(plan[4]).toMatchObject({
        id: expect.stringMatching(/[0-9a-f]{32}/),
        groupId: plan[3].id,
        context: {
          command: 'node',
          workspace: {
            name: 'wks-c',
            cwd: path.join(prjDir, 'wks-c')
          }
        }
      });

      await expect(fileExists(path.join(prjDir, 'wks-c', 'script.txt'))).resolves.toBe(false);
    });
  });
}, { timeout: 10000 });
