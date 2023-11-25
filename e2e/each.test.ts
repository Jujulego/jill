import fs from 'node:fs/promises';
import path from 'node:path';

import { TestBed } from '@/tools/test-bed.js';
import { fileExists } from '@/tools/utils.js';

import { jill } from './utils.js';

// Setup
const bed = new TestBed();

beforeAll(() => {
  const wksC = bed.addWorkspace('wks-c', {
    scripts: {
      // language=bash
      build: 'node -e "require(\'node:fs\').writeFileSync(\'build.txt\', \'built\')"',
      // language=bash
      prehooked: 'node -e "require(\'node:fs\').writeFileSync(\'pre-hook.txt\', \'hooked\')"',
      // language=bash
      hooked: 'node -e "require(\'node:fs\').writeFileSync(\'hook.txt\', \'hooked\')"',
      // language=bash
      posthooked: 'node -e "require(\'node:fs\').writeFileSync(\'post-hook.txt\', \'hooked\')"',
    }
  });

  const wksB = bed.addWorkspace('wks-b', {
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
  })
    .addDependency(wksC, true);

  bed.addWorkspace('wks-a', {
    scripts: {
      // language=bash
      build: 'node -e "require(\'node:fs\').writeFileSync(\'build.txt\', \'built\')"',
      // language=bash
      start: 'node -e "require(\'node:fs\').writeFileSync(\'start.txt\', \'started\')"'
    }
  })
    .addDependency(wksB)
    .addDependency(wksC, true);
});

// Tests
describe('jill each', () => {
  describe.each(['npm', 'yarn'] as const)('using %s', (packageManager) => {
    // Create project folder
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
    it('should run start script on each workspace (and build dependencies)', async () => {
      const res = await jill('each start', { cwd: prjDir });

      // Check jill output
      expect(res.code).toBe(0);

      expect(res.screen.screen).toMatchLines([
        expect.ignoreColor(/^. Run start in wks-a \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^. Run build in wks-b \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^. Run start in wks-b \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^. Run build in wks-c \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^. 4 done$/),
      ]);

      // Check script result
      await expect(fs.readFile(path.join(prjDir, 'wks-c', 'build.txt'), 'utf8'))
        .resolves.toBe('built');

      await expect(fs.readFile(path.join(prjDir, 'wks-b', 'build.txt'), 'utf8'))
        .resolves.toBe('built');

      await expect(fs.readFile(path.join(prjDir, 'wks-b', 'start.txt'), 'utf8'))
        .resolves.toBe('started');

      await expect(fs.readFile(path.join(prjDir, 'wks-a', 'start.txt'), 'utf8'))
        .resolves.toBe('started');
    });

    it('should run build and start script on each workspace (and build dependencies)', async () => {
      const res = await jill('each "build && start"', { cwd: prjDir });

      // Check jill output
      expect(res.code).toBe(0);

      expect(res.screen.screen).toMatchLines([
        expect.ignoreColor(/^. In sequence \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^ {2}. Run build in wks-a \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^ {2}. Run start in wks-a \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^. In sequence \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^ {2}. Run build in wks-b \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^ {2}. Run start in wks-b \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^. Run build in wks-c \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^. 5 done$/),
      ]);

      // Check script result
      await expect(fs.readFile(path.join(prjDir, 'wks-c', 'build.txt'), 'utf8'))
        .resolves.toBe('built');

      await expect(fs.readFile(path.join(prjDir, 'wks-b', 'build.txt'), 'utf8'))
        .resolves.toBe('built');

      await expect(fs.readFile(path.join(prjDir, 'wks-b', 'start.txt'), 'utf8'))
        .resolves.toBe('started');

      await expect(fs.readFile(path.join(prjDir, 'wks-a', 'build.txt'), 'utf8'))
        .resolves.toBe('built');

      await expect(fs.readFile(path.join(prjDir, 'wks-a', 'start.txt'), 'utf8'))
        .resolves.toBe('started');
    });

    it('should run hooked script with its hooks on each workspace (and build dependencies)', async () => {
      const res = await jill('each hooked', { cwd: prjDir });

      // Check jill output
      expect(res.code).toBe(0);

      expect(res.screen.screen).toMatchLines([
        expect.ignoreColor(/^. Run hooked in wks-b \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^. Run build in wks-c \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^. Run hooked in wks-c \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^. 7 done$/),
      ]);

      // Check script result
      await expect(fs.readFile(path.join(prjDir, 'wks-c', 'pre-hook.txt'), 'utf8'))
        .resolves.toBe('hooked');

      await expect(fs.readFile(path.join(prjDir, 'wks-c', 'hook.txt'), 'utf8'))
        .resolves.toBe('hooked');

      await expect(fs.readFile(path.join(prjDir, 'wks-c', 'post-hook.txt'), 'utf8'))
        .resolves.toBe('hooked');

      await expect(fs.readFile(path.join(prjDir, 'wks-c', 'build.txt'), 'utf8'))
        .resolves.toBe('built');

      await expect(fs.readFile(path.join(prjDir, 'wks-b', 'pre-hook.txt'), 'utf8'))
        .resolves.toBe('hooked');

      await expect(fs.readFile(path.join(prjDir, 'wks-b', 'hook.txt'), 'utf8'))
        .resolves.toBe('hooked');

      await expect(fs.readFile(path.join(prjDir, 'wks-b', 'post-hook.txt'), 'utf8'))
        .resolves.toBe('hooked');
    });

    it('should run fails script on each workspace (and build dependencies)', async () => {
      const res = await jill('each fails', { cwd: prjDir });

      // Check jill output
      expect(res.code).toBe(1);

      expect(res.screen.screen).toMatchLines([
        expect.ignoreColor(/^. Run fails in wks-b \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^ {2}.( yarn exec)? node -e "process.exit\(1\)" \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^. Run build in wks-c \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^. 1 done, . 1 failed$/),
      ]);

      // Check script result
      await expect(fs.readFile(path.join(prjDir, 'wks-c', 'build.txt'), 'utf8'))
        .resolves.toBe('built');

      await expect(fs.access(path.join(prjDir, 'wks-b', 'build.txt')))
        .rejects.toMatchObject({ code: 'ENOENT' });

      await expect(fs.access(path.join(prjDir, 'wks-b', 'start.txt')))
        .rejects.toMatchObject({ code: 'ENOENT' });

      await expect(fs.access(path.join(prjDir, 'wks-a', 'start.txt')))
        .rejects.toMatchObject({ code: 'ENOENT' });
    });

    it('should exit 1 if no workspace is found', async () => {
      const res = await jill('each toto', { cwd: prjDir });

      // Check jill output
      expect(res.code).toBe(1);
      expect(res.stderr).toMatchLines([
        expect.ignoreColor(/^. No matching workspace found !$/),
      ]);

      // No new files
      await expect(fs.access(path.join(prjDir, 'wks-c', 'build.txt')))
        .rejects.toMatchObject({ code: 'ENOENT' });

      await expect(fs.access(path.join(prjDir, 'wks-b', 'build.txt')))
        .rejects.toMatchObject({ code: 'ENOENT' });

      await expect(fs.access(path.join(prjDir, 'wks-b', 'start.txt')))
        .rejects.toMatchObject({ code: 'ENOENT' });

      await expect(fs.access(path.join(prjDir, 'wks-a', 'start.txt')))
        .rejects.toMatchObject({ code: 'ENOENT' });
    });

    it('should print task plan and do not run any script', async () => {
      const res = await jill('each --plan --plan-mode json start', { cwd: prjDir });

      // Check jill output
      expect(res.code).toBe(0);

      const plan = JSON.parse(res.stdout.join('\n'));
      expect(plan).toHaveLength(8);

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

      expect(plan[4]).toMatchObject({
        id: expect.stringMatching(/[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}/),
        isGroup: true,
        dependenciesIds: [
          plan[0].id
        ],
        context: {
          script: 'build',
          workspace: {
            name: 'wks-b',
            cwd: path.join(prjDir, 'wks-b')
          }
        }
      });

      expect(plan[5]).toMatchObject({
        id: expect.stringMatching(/[0-9a-f]{32}/),
        groupId: plan[4].id,
        context: {
          command: 'node',
          workspace: {
            name: 'wks-b',
            cwd: path.join(prjDir, 'wks-b')
          }
        }
      });

      expect(plan[6]).toMatchObject({
        id: expect.stringMatching(/[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}/),
        isGroup: true,
        dependenciesIds: [
          plan[4].id,
          plan[0].id,
        ],
        context: {
          script: 'start',
          workspace: {
            name: 'wks-a',
            cwd: path.join(prjDir, 'wks-a')
          }
        }
      });

      expect(plan[7]).toMatchObject({
        id: expect.stringMatching(/[0-9a-f]{32}/),
        groupId: plan[6].id,
        context: {
          command: 'node',
          workspace: {
            name: 'wks-a',
            cwd: path.join(prjDir, 'wks-a')
          }
        }
      });

      await expect(fileExists(path.join(prjDir, 'wks-c', 'hook.txt'))).resolves.toBe(false);
      await expect(fileExists(path.join(prjDir, 'wks-b', 'hook.txt'))).resolves.toBe(false);
      await expect(fileExists(path.join(prjDir, 'wks-b', 'start.txt'))).resolves.toBe(false);
      await expect(fileExists(path.join(prjDir, 'wks-a', 'start.txt'))).resolves.toBe(false);
    });
  });
}, { timeout: 10000 });
