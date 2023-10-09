import fs from 'node:fs/promises';
import path from 'node:path';

import { TestBed } from '@/tools/test-bed.js';
import { fileExists } from '@/tools/utils.js';

import { jill } from './utils.js';

describe('jill run', () => {
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
          start: 'node -e "require(\'node:fs\').writeFileSync(\'script.txt\', \'start\')"',
          // language=bash
          fails: 'node -e "process.exit(1)"',
        }
      });
      const wksB = bed.addWorkspace('wks-b', {
        scripts: {
          // language=bash
          start: 'node -e "require(\'node:fs\').writeFileSync(\'script.txt\', \'start\')"'
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
    it('should run wks-c start script', async () => {
      const res = await jill('run -w wks-c start', { cwd: prjDir });

      // Check jill output
      expect(res.code).toBe(0);

      expect(res.screen.screen).toMatchLines([
        expect.ignoreColor(/^. Run start in wks-c \(took [0-9.]+m?s\)$/),
      ]);

      // Check script result
      await expect(fs.readFile(path.join(prjDir, 'wks-c', 'script.txt'), 'utf8'))
        .resolves.toBe('start');
    });

    it('should run wks-c fails script and exit 1', async () => {
      const res = await jill('run -w wks-c fails', { cwd: prjDir });

      // Check jill output
      expect(res.code).toBe(1);

      expect(res.screen.screen).toMatchLines([
        expect.ignoreColor(/^. Run fails in wks-c \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^ {2}.( yarn exec)? node -e "process.exit\(1\)" \(took [0-9.]+m?s\)$/),
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
        expect.ignoreColor(/^. Run build in wks-c \(took [0-9.]+m?s\)$/),
        expect.ignoreColor(/^. Run start in wks-b \(took [0-9.]+m?s\)$/),
      ]);

      // Check scripts result
      await expect(fs.readFile(path.join(prjDir, 'wks-c', 'script.txt'), 'utf8'))
        .resolves.toBe('build');

      await expect(fs.readFile(path.join(prjDir, 'wks-b', 'script.txt'), 'utf8'))
        .resolves.toBe('start');
    });

    it('should print task plan and do not run any script', async () => {
      const res = await jill('run -w wks-b --plan --plan-mode json start', { cwd: prjDir });

      // Check jill plan
      expect(res.code).toBe(0);
      expect(res.stdout).toHaveLength(1);

      const plan = JSON.parse(res.stdout[0]);
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

      await expect(fileExists(path.join(prjDir, 'wks-c', 'script.txt'))).resolves.toBe(false);
      await expect(fileExists(path.join(prjDir, 'wks-b', 'script.txt'))).resolves.toBe(false);
    });
  });
}, { timeout: 10000 });
