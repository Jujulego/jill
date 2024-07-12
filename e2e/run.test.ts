import fs from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import '@/src/commons/logger.service.js';
import { TestBed } from '@/tools/test-bed.js';

import { fileExists, jill } from './utils.js';

// Setup
const bed = new TestBed();

beforeAll(() => {
  const wksC = bed.addWorkspace('wks-c', {
    scripts: {
      // language=bash
      build: 'node -e "require(\'node:fs\').writeFileSync(\'build.txt\', \'built\')"',
      // language=bash
      start: 'node -e "require(\'node:fs\').writeFileSync(\'start.txt\', \'started\')"',
      // language=bash
      prehooked: 'node -e "require(\'node:fs\').writeFileSync(\'pre-hook.txt\', \'hooked\')"',
      // language=bash
      hooked: 'node -e "require(\'node:fs\').writeFileSync(\'hook.txt\', \'hooked\')"',
      // language=bash
      posthooked: 'node -e "require(\'node:fs\').writeFileSync(\'post-hook.txt\', \'hooked\')"',
      // language=bash
      fails: 'node -e "process.exit(1)"',
    }
  });

  const wksB = bed.addWorkspace('wks-b', {
    scripts: {
      // language=bash
      start: 'node -e "require(\'node:fs\').writeFileSync(\'start.txt\', \'started\')"'
    }
  })
    .addDependency(wksC, true);

  bed.addWorkspace('wks-a')
    .addDependency(wksB)
    .addDependency(wksC, true);
});

// Tests
describe('jill run', () => {
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
    it('should run wks-c start script', async () => {
      const res = await jill('run -w wks-c start', { cwd: prjDir });

      // Check jill output
      expect(res.code).toBe(0);

      expect(res.screen.screen).toMatchLines([
        expect.ignoreColor(/^. Run start in wks-c \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^. 1 done$/),
      ]);

      // Check script result
      await expect(fs.readFile(path.join(prjDir, 'wks-c', 'start.txt'), 'utf8'))
        .resolves.toBe('started');
    });

    it('should run wks-c build and start scripts', async () => {
      const res = await jill('run -w wks-c "build && start"', { cwd: prjDir });

      // Check jill output
      expect(res.code).toBe(0);

      expect(res.screen.screen).toMatchLines([
        expect.ignoreColor(/^. In sequence \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^ {2}. Run build in wks-c \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^ {2}. Run start in wks-c \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^. 2 done$/),
      ]);

      // Check script result
      await expect(fs.readFile(path.join(prjDir, 'wks-c', 'build.txt'), 'utf8'))
        .resolves.toBe('built');

      await expect(fs.readFile(path.join(prjDir, 'wks-c', 'start.txt'), 'utf8'))
        .resolves.toBe('started');
    });

    it('should run wks-c hooked script with its hooks', async () => {
      const res = await jill('run -w wks-c hooked', { cwd: prjDir });

      // Check jill output
      expect(res.code).toBe(0);

      expect(res.screen.screen).toMatchLines([
        expect.ignoreColor(/^. Run hooked in wks-c \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^. 3 done$/),
      ]);

      // Check script result
      await expect(fs.readFile(path.join(prjDir, 'wks-c', 'pre-hook.txt'), 'utf8'))
        .resolves.toBe('hooked');

      await expect(fs.readFile(path.join(prjDir, 'wks-c', 'hook.txt'), 'utf8'))
        .resolves.toBe('hooked');

      await expect(fs.readFile(path.join(prjDir, 'wks-c', 'post-hook.txt'), 'utf8'))
        .resolves.toBe('hooked');
    });

    it('should run wks-c fails script and exit 1', async () => {
      const res = await jill('run -w wks-c fails', { cwd: prjDir });

      // Check jill output
      expect(res.code).toBe(1);

      expect(res.screen.screen).toMatchLines([
        expect.ignoreColor(/^. Run fails in wks-c \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^ {2}.( yarn exec)? node -e "process.exit\(1\)" \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^. 1 failed$/),
      ]);
    });

    it('should run wks-c build and fails script and exit 1', async () => {
      const res = await jill('run -w wks-c "build && fails"', { cwd: prjDir });

      // Check jill output
      expect(res.code).toBe(1);

      expect(res.screen.screen).toMatchLines([
        expect.ignoreColor(/^. In sequence \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^ {2}. Run build in wks-c \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^ {2}. Run fails in wks-c \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^ {4}.( yarn exec)? node -e "process.exit\(1\)" \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^. 1 done, . 1 failed$/),
      ]);
    });

    it('should exit 1 if script does not exists', async () => {
      const res = await jill('run -w wks-c miss', { cwd: prjDir });

      // Check jill output
      expect(res.code).toBe(1);

      expect(res.stderr).toMatchLines([
        expect.ignoreColor('Workspace wks-c have no miss script'),
      ]);
    });

    it('should run wks-b start script and build script', async () => {
      const res = await jill('run -w wks-b start', { cwd: prjDir });

      // Check jill output
      expect(res.code).toBe(0);

      expect(res.screen.screen).toMatchLines([
        expect.ignoreColor(/^. Run start in wks-b \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^. Run build in wks-c \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^. 2 done$/),
      ]);

      // Check scripts result
      await expect(fs.readFile(path.join(prjDir, 'wks-c', 'build.txt'), 'utf8'))
        .resolves.toBe('built');

      await expect(fs.readFile(path.join(prjDir, 'wks-b', 'start.txt'), 'utf8'))
        .resolves.toBe('started');
    });

    it('should print task plan and do not run any script', async () => {
      const res = await jill('run -w wks-b --plan --plan-mode json start', { cwd: prjDir });

      // Check jill plan
      expect(res.code).toBe(0);

      const plan = JSON.parse(res.stdout.join('\n'));
      expect(plan).toHaveLength(4);

      expect(plan[0]).toMatchObject({
        id: expect.stringMatching(/[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}/),
        isGroup: true,
        context: {
          script: 'build',
          workspace: {
            name: 'wks-c',
            cwd: path.join(prjDir, 'wks-c')
          }
        }
      });

      expect(plan[1]).toMatchObject({
        id: expect.stringMatching(/[0-9a-f]{32}/),
        groupId: plan[0].id,
        context: {
          command: 'node',
          workspace: {
            name: 'wks-c',
            cwd: path.join(prjDir, 'wks-c')
          }
        }
      });

      expect(plan[2]).toMatchObject({
        id: expect.stringMatching(/[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}/),
        isGroup: true,
        dependenciesIds: [
          plan[0].id
        ],
        context: {
          script: 'start',
          workspace: {
            name: 'wks-b',
            cwd: path.join(prjDir, 'wks-b')
          }
        }
      });

      expect(plan[3]).toMatchObject({
        id: expect.stringMatching(/[0-9a-f]{32}/),
        groupId: plan[2].id,
        context: {
          command: 'node',
          workspace: {
            name: 'wks-b',
            cwd: path.join(prjDir, 'wks-b')
          }
        }
      });

      await expect(fileExists(path.join(prjDir, 'wks-c', 'build.txt'))).resolves.toBe(false);
      await expect(fileExists(path.join(prjDir, 'wks-b', 'start.txt'))).resolves.toBe(false);
    });
  });
}, { timeout: 10000 });
