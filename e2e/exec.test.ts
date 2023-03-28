import fs from 'node:fs/promises';
import path from 'node:path';

import { TestBed } from '@/tools/test-bed';
import { fileExists } from '@/tools/utils';

import { withPackageManager, jill } from './utils';

describe('jill exec', () => void withPackageManager((packageManager) => {
  // Setup
  let prjDir: string;

  beforeEach(async () => {
    const bed = new TestBed();

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

    prjDir = await bed.createProjectPackage(packageManager);
  });

  afterEach(async () => {
    await fs.rm(prjDir, { recursive: true });
  });

  // Tests
  it('should run node in wks-c', async () => {
    const res = await jill('exec -w wks-c node -- -e "require(\'node:fs\').writeFileSync(\'script.txt\', \'node\')"', { cwd: prjDir, removeCotes: true });

    // Check jill output
    expect(res.code).toBe(0);

    expect(res.screen.screen).toMatchLines([
      expect.ignoreColor(/^. node -e "require\('node:fs'\).+ \(took [0-9.]+m?s\)/),
    ]);

    // Check script result
    await expect(fs.readFile(path.join(prjDir, 'wks-c', 'script.txt'), 'utf8'))
      .resolves.toBe('node');
  });

  it('should be the default command', async () => {
    const res = await jill('-w wks-c node -- -e "require(\'node:fs\').writeFileSync(\'script.txt\', \'node\')"', { cwd: prjDir, removeCotes: true });

    // Check jill output
    expect(res.code).toBe(0);

    // Check script result
    await expect(fs.readFile(path.join(prjDir, 'wks-c', 'script.txt'), 'utf8'))
      .resolves.toBe('node');
  });

  it('should run wks-c fails script and exit 1', async () => {
    const res = await jill('exec -w wks-c node -- -e "process.exit(1)"', { cwd: prjDir, removeCotes: true });

    // Check jill output
    expect(res.code).toBe(1);

    expect(res.screen.screen).toMatchLines([
      expect.ignoreColor(/^.( yarn)? node -e "process.exit\(1\)" \(took [0-9.]+m?s\)$/),
    ]);
  });

  it('should run wks-b start script and build script', async () => {
    const res = await jill('-w wks-b node -- -e "require(\'node:fs\').writeFileSync(\'script.txt\', \'node\')"', { cwd: prjDir, removeCotes: true });

    // Check jill output
    expect(res.code).toBe(0);

    expect(res.screen.screen).toMatchLines([
      expect.ignoreColor(/^. Running build in wks-c \(took [0-9.]+m?s\)$/),
      expect.ignoreColor(/^ {2}.( yarn)? node -e "require\('node:fs'\).+ \(took [0-9.]+m?s\)$/),
      expect.ignoreColor(/^. node -e "require\('node:fs'\).+ \(took [0-9.]+m?s\)/),
    ]);

    // Check scripts result
    await expect(fs.readFile(path.join(prjDir, 'wks-c', 'script.txt'), 'utf8'))
      .resolves.toBe('build');

    await expect(fs.readFile(path.join(prjDir, 'wks-b', 'script.txt'), 'utf8'))
      .resolves.toBe('node');
  });

  it('should print task plan and do not run any script', async () => {
    const res = await jill('-w wks-b --plan --plan-mode json node -- -e "require(\'node:fs\').writeFileSync(\'script.txt\', \'node\')"', { cwd: prjDir, removeCotes: true });

    // Check jill plan
    expect(res.code).toBe(0);
    expect(res.stdout).toHaveLength(1);

    const plan = JSON.parse(res.stdout[0]);
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
}));
