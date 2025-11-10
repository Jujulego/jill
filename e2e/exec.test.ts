import { TestBed } from '@/tools/test-bed.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
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
    }, 60000);

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
      expect(res.code).toBe(0);

      expect(res.screen.screen).toMatchLines(['']);

      // Check script result
      await expect(fs.readFile(path.join(prjDir, 'wks-c', 'script.txt'), 'utf8'))
        .resolves.toBe('node');
    });

    it('should run echo in wks-c', async () => {
      const res = await jill('exec -w wks-c echo toto', { cwd: prjDir, keepQuotes: true });

      // Check jill output
      expect(res.code).toBe(0);

      expect(res.screen.screen).toMatchLines(['toto']);
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
        expect.ignoreColor(/^. Build dependencies \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^ {2}. Run build script in wks-c \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^. 1 done$/),
      ]);

      // Check scripts result
      await expect(fs.readFile(path.join(prjDir, 'wks-c', 'script.txt'), 'utf8'))
        .resolves.toBe('build');

      await expect(fs.readFile(path.join(prjDir, 'wks-b', 'script.txt'), 'utf8'))
        .resolves.toBe('node');
    });

    it('should print task plan and do not run any script', async () => {
      const res = await jill('-w wks-b --plan node -e "require(\'node:fs\').writeFileSync(\'script.txt\', \'node\')"', { cwd: prjDir, keepQuotes: true });

      // Check jill plan
      expect(res.code).toBe(0);

      expect(res.screen.screen).toMatchSnapshot();

      await expect(fileExists(path.join(prjDir, 'wks-c', 'script.txt'))).resolves.toBe(false);
      await expect(fileExists(path.join(prjDir, 'wks-b', 'script.txt'))).resolves.toBe(false);
    });

    it.skip('should print task plan in json and do not run any script', async () => {
      const res = await jill('-w wks-b --plan --plan-mode json node -e "require(\'node:fs\').writeFileSync(\'script.txt\', \'node\')"', { cwd: prjDir, keepQuotes: true });

      // Check jill plan
      expect(res.code).toBe(0);

      const plan = JSON.parse(res.stdout.join('\n')) as { id: string }[];
      expect(plan).toHaveLength(3);

      expect(plan[0]).toMatchObject({
        id: expect.stringMatching(/[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}/),
        isGroup: true,
        context: {
          script: 'build',
          workspace: {
            name: 'wks-c',
            root: path.join(prjDir, 'wks-c')
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
            root: path.join(prjDir, 'wks-c')
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
            root: path.join(prjDir, 'wks-b')
          }
        }
      });

      await expect(fileExists(path.join(prjDir, 'wks-c', 'script.txt'))).resolves.toBe(false);
      await expect(fileExists(path.join(prjDir, 'wks-b', 'script.txt'))).resolves.toBe(false);
    });

    it('should work without config file', async () => {
      await fs.rm(path.join(prjDir, '.jillrc.json'));
      const res = await jill('exec -w wks-c node -e "require(\'node:fs\').writeFileSync(\'script.txt\', \'node\')"', { cwd: prjDir, keepQuotes: true });

      // Check jill output
      expect(res.code).toBe(0);

      // Check script result
      await expect(fs.readFile(path.join(prjDir, 'wks-c', 'script.txt'), 'utf8'))
        .resolves.toBe('node');
    });
  });
}, 10000);
