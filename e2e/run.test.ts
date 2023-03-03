import fs from 'node:fs/promises';
import path from 'node:path';

import { TestBed } from '@/tools/test-bed';
import { fileExists, noColor } from '@/tools/utils';

import { usePackageManager, jill } from './utils';

describe('jill run', () => void usePackageManager((packageManager) => {
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
  });

  afterEach(async () => {
    await fs.rm(prjDir, { recursive: true });
  });

  // Tests
  it('should run wks-c start script', async () => {
    const res = await jill(['run', '-w', 'wks-c', 'start'], { cwd: prjDir });

    // Check jill output
    expect(res.code).toBe(0);

    const screen = res.screen.screen.split('\n')
      .filter((line) => !noColor(line).startsWith('[wks-c#start]'));

    expect(screen).toMatchLines([
      expect.ignoreColor(/. Running start in wks-c \(took [0-9.]+m?s\)/),
    ]);

    // Check script result
    await expect(fs.readFile(path.join(prjDir, 'wks-c', 'script.txt'), 'utf8'))
      .resolves.toBe('start');
  });

  it('should run wks-c fails script and exit 1', async () => {
    const res = await jill(['run', '-w', 'wks-c', 'fails'], { cwd: prjDir });

    // Check jill output
    expect(res.code).toBe(1);

    const screen = res.screen.screen.split('\n')
      .filter((line) => !noColor(line).startsWith('[wks-c#fails]'));

    expect(screen).toMatchLines([
      expect.ignoreColor(/. Running fails in wks-c \(took [0-9.]+m?s\)/),
    ]);
  });

  it('should run wks-b start script and build script', async () => {
    const res = await jill(['run', '-w', 'wks-b', 'start'], { cwd: prjDir });

    // Check jill output
    expect(res.code).toBe(0);

    const screen = res.screen.screen.split('\n')
      .filter((line) => !noColor(line).startsWith('[wks-c#build]'))
      .filter((line) => !noColor(line).startsWith('[wks-b#start]'));

    expect(screen).toMatchLines([
      expect.ignoreColor(/. Running build in wks-c \(took [0-9.]+m?s\)/),
      expect.ignoreColor(/. Running start in wks-b \(took [0-9.]+m?s\)/),
    ]);

    // Check scripts result
    await expect(fs.readFile(path.join(prjDir, 'wks-c', 'script.txt'), 'utf8'))
      .resolves.toBe('build');

    await expect(fs.readFile(path.join(prjDir, 'wks-b', 'script.txt'), 'utf8'))
      .resolves.toBe('start');
  });

  it('should print task plan and do not run any script', async () => {
    const res = await jill(['run', '-w', 'wks-b', '--plan', '--planMode', 'json', 'start'], { cwd: prjDir });

    // Check jill plan
    expect(res.code).toBe(0);
    expect(res.stdout).toHaveLength(1);

    const plan = JSON.parse(res.stdout[0]);
    expect(plan).toHaveLength(2);

    expect(plan[0]).toMatchSnapshot({
      id: expect.stringMatching(/[0-9a-f]{32}/),
      context: {
        workspace: {
          cwd: expect.any(String)
        }
      }
    });
    expect(plan[0].context.workspace.cwd).toBe(path.join(prjDir, 'wks-c'));

    expect(plan[1]).toMatchSnapshot({
      id: expect.stringMatching(/[0-9a-f]{32}/),
      dependenciesIds: [
        expect.stringMatching(/[0-9a-f]{32}/)
      ],
      context: {
        workspace: {
          cwd: expect.any(String)
        }
      }
    });
    expect(plan[1].dependenciesIds).toEqual([plan[0].id]);
    expect(plan[1].context.workspace.cwd).toBe(path.join(prjDir, 'wks-b'));

    await expect(fileExists(path.join(prjDir, 'wks-c', 'script.txt'))).resolves.toBe(false);
    await expect(fileExists(path.join(prjDir, 'wks-b', 'script.txt'))).resolves.toBe(false);
  });
}));
