import fs from 'node:fs/promises';
import path from 'node:path';

import { TestBed } from '@/tools/test-bed';
import { fileExists } from '@/tools/utils';

import { jill, withPackageManager } from './utils';

describe('jill each', () => void withPackageManager((packageManager) => {
  // Setup
  let prjDir: string;

  beforeEach(async () => {
    const bed = new TestBed();

    const wksC = bed.addWorkspace('wks-c', {
      scripts: {
        // language=bash
        build: 'node -e "require(\'node:fs\').writeFileSync(\'build.txt\', \'built\')"',
      }
    });
    const wksB = bed.addWorkspace('wks-b', {
      scripts: {
        // language=bash
        build: 'node -e "require(\'node:fs\').writeFileSync(\'build.txt\', \'built\')"',
        // language=bash
        start: 'node -e "require(\'node:fs\').writeFileSync(\'start.txt\', \'started\')"',
        // language=bash
        fails: 'node -e "process.exit(1)"',
      }
    })
      .addDependency(wksC, true);
    bed.addWorkspace('wks-a', {
      scripts: {
        // language=bash
        start: 'node -e "require(\'node:fs\').writeFileSync(\'start.txt\', \'started\')"'
      }
    })
      .addDependency(wksB)
      .addDependency(wksC, true);

    prjDir = await bed.createProjectPackage(packageManager);
  });

  afterEach(async () => {
    await fs.rm(prjDir, { recursive: true });
  });

  // Tests
  it('should run start script on each workspace (and build dependencies)', async () => {
    const res = await jill(['each', 'start'], { cwd: prjDir });

    // Check jill output
    expect(res.code).toBe(0);

    expect(res.screen.screen).toMatchLines([
      expect.ignoreColor(/^. Running build in wks-c \(took [0-9.]+m?s\)$/),
      expect.ignoreColor(/^ {2}.( yarn)? node -e "require\('node:fs'\).+ \(took [0-9.]+m?s\)$/),
      expect.ignoreColor(/^. Running start in wks-b \(took [0-9.]+m?s\)$/),
      expect.ignoreColor(/^ {2}.( yarn)? node -e "require\('node:fs'\).+ \(took [0-9.]+m?s\)$/),
      expect.ignoreColor(/^. Running build in wks-b \(took [0-9.]+m?s\)$/),
      expect.ignoreColor(/^ {2}.( yarn)? node -e "require\('node:fs'\).+ \(took [0-9.]+m?s\)$/),
      expect.ignoreColor(/^. Running start in wks-a \(took [0-9.]+m?s\)$/),
      expect.ignoreColor(/^ {2}.( yarn)? node -e "require\('node:fs'\).+ \(took [0-9.]+m?s\)$/),
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

  it('should run fails script on each workspace (and build dependencies)', async () => {
    const res = await jill(['each', 'fails'], { cwd: prjDir });

    // Check jill output
    expect(res.code).toBe(1);

    expect(res.screen.screen).toMatchLines([
      expect.ignoreColor(/^. Running build in wks-c \(took [0-9.]+m?s\)$/),
      expect.ignoreColor(/^ {2}.( yarn)? node -e "require\('node:fs'\).+ \(took [0-9.]+m?s\)$/),
      expect.ignoreColor(/^. Running fails in wks-b \(took [0-9.]+m?s\)$/),
      expect.ignoreColor(/^ {2}.( yarn)? node -e "process.exit\(1\)" \(took [0-9.]+m?s\)$/),
    ]);

    // Check script result
    await expect(fs.readFile(path.join(prjDir, 'wks-c', 'build.txt'), 'utf8'))
      .resolves.toBe('built');
  });

  it('should exit 1 if no workspace is found', async () => {
    const res = await jill(['each', 'toto'], { cwd: prjDir });

    // Check jill output
    expect(res.code).toBe(1);
    expect(res.screen.screen).toMatchLines([
      expect.ignoreColor(/^. No matching workspace found !$/),
    ]);
  });

  it('should print task plan and do not run any script', async () => {
    const res = await jill(['each', '--plan', '--planMode', 'json', 'start'], { cwd: prjDir });

    // Check jill output
    expect(res.code).toBe(0);
    expect(res.stdout).toHaveLength(1);

    const plan = JSON.parse(res.stdout[0]);
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
        command: packageManager === 'yarn' ? 'yarn' : 'node',
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
        command: packageManager === 'yarn' ? 'yarn' : 'node',
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
        command: packageManager === 'yarn' ? 'yarn' : 'node',
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
        command: packageManager === 'yarn' ? 'yarn' : 'node',
        workspace: {
          name: 'wks-a',
          cwd: path.join(prjDir, 'wks-a')
        }
      }
    });

    await expect(fileExists(path.join(prjDir, 'wks-c', 'script.txt'))).resolves.toBe(false);
    await expect(fileExists(path.join(prjDir, 'wks-b', 'script.txt'))).resolves.toBe(false);
    await expect(fileExists(path.join(prjDir, 'wks-b', 'start.txt'))).resolves.toBe(false);
    await expect(fileExists(path.join(prjDir, 'wks-a', 'start.txt'))).resolves.toBe(false);
  });
}));
