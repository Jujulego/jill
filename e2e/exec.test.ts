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
      build: 'node -e "require(\'node:fs\').writeFileSync(\'script.txt\', \'build\')"',
    }
  });

  const wksB = bed.addWorkspace('wks-b')
    .addDependency(wksC, true);

  bed.addWorkspace('wks-a')
    .addDependency(wksB)
    .addDependency(wksC, true);
});

// Tests
describe('jill exec', () => {
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
    it('should run node in wks-c', async () => {
      const res = await jill('exec -w wks-c node -e "require(\'node:fs\').writeFileSync(\'script.txt\', \'node\')"', { cwd: prjDir, keepQuotes: true });

      // Check jill output
      console.log(res.stdout);
      console.log(res.stderr);

      expect(res.code).toBe(0);

      expect(res.screen.screen).toMatchLines(['']);
      expect(res.stderr).toMatchLines([
        expect.ignoreColor('No task found')
      ]);

      // Check script result
      await expect(fs.readFile(path.join(prjDir, 'wks-c', 'script.txt'), 'utf8'))
        .resolves.toBe('node');
    });

    it('should run echo in wks-c', async () => {
      const res = await jill('exec -w wks-c echo toto', { cwd: prjDir, keepQuotes: true });

      // Check jill output
      expect(res.code).toBe(0);

      expect(res.screen.screen).toMatchLines(['', 'toto']);
      expect(res.stderr).toMatchLines([
        expect.ignoreColor('No task found')
      ]);
    });

    it('should be the default command', async () => {
      const res = await jill('-w wks-c node -e "require(\'node:fs\').writeFileSync(\'script.txt\', \'node\')"', { cwd: prjDir, keepQuotes: true });

      // Check jill output
      expect(res.code).toBe(0);

      // Check script result
      await expect(fs.readFile(path.join(prjDir, 'wks-c', 'script.txt'), 'utf8'))
        .resolves.toBe('node');
    });

    it('should run wks-c fails script and exit 1', async () => {
      const res = await jill('exec -w wks-c node -e "process.exit(1)"', { cwd: prjDir, keepQuotes: true });

      // Check jill output
      expect(res.code).toBe(1);
    });

    it('should run wks-b start script and build script', async () => {
      const res = await jill('-w wks-b node -e "require(\'node:fs\').writeFileSync(\'script.txt\', \'node\')"', { cwd: prjDir, keepQuotes: true });

      // Check jill output
      expect(res.code).toBe(0);

      expect(res.screen.screen).toMatchLines([
        expect.ignoreColor(/^. Run build in wks-c \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^. 1 done$/),
      ]);

      // Check scripts result
      await expect(fs.readFile(path.join(prjDir, 'wks-c', 'script.txt'), 'utf8'))
        .resolves.toBe('build');

      await expect(fs.readFile(path.join(prjDir, 'wks-b', 'script.txt'), 'utf8'))
        .resolves.toBe('node');
    });

    it('should print task plan and do not run any script', async () => {
      const res = await jill('-w wks-b --plan --plan-mode json node -e "require(\'node:fs\').writeFileSync(\'script.txt\', \'node\')"', { cwd: prjDir, keepQuotes: true });

      // Check jill plan
      expect(res.code).toBe(0);

      const plan = JSON.parse(res.stdout.join('\n'));
      expect(plan).toHaveLength(3);

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
        id: expect.stringMatching(/[0-9a-f]{32}/),
        dependenciesIds: [
          plan[0].id
        ],
        context: {
          command: 'node',
          workspace: {
            name: 'wks-b',
            cwd: path.join(prjDir, 'wks-b')
          }
        }
      });

      await expect(fileExists(path.join(prjDir, 'wks-c', 'script.txt'))).resolves.toBe(false);
      await expect(fileExists(path.join(prjDir, 'wks-b', 'script.txt'))).resolves.toBe(false);
    });
  });
}, { timeout: 10000 });
