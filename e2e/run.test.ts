import fs from 'node:fs/promises';
import path from 'node:path';

import { TestBed } from '@/tools/test-bed';
import { fileExists } from '@/tools/utils';

import { getPackageManager, jill } from './utils';

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

  prjDir = await bed.createProjectPackage(getPackageManager());
});

afterEach(async () => {
  await fs.rm(prjDir, { recursive: true });
});

// Tests
describe('jill run', () => {
  it('should run wks-c start script', async () => {
    const res = await jill(['run', '-w', 'wks-c', 'start'], { cwd: prjDir });

    // Check jill output
    expect(res.code).toBe(0);
    expect(res.screen.screen).toMatchLines([
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
    expect(res.screen.screen).toMatchLines([
      expect.ignoreColor(/. Running fails in wks-c \(took [0-9.]+m?s\)/),
    ]);
  });

  it('should run wks-b start script and build script', async () => {
    const res = await jill(['run', '-w', 'wks-b', 'start'], { cwd: prjDir });

    // Check jill output
    expect(res.code).toBe(0);
    expect(res.screen.screen).toMatchLines([
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
    const res = await jill(['run', '-w', 'wks-b', '--plan', 'start'], { cwd: prjDir });

    // Check jill output
    expect(res.code).toBe(0);
    expect(res.screen.screen).toMatchLines([
      expect.ignoreColor('Id      Name            Workspace  Group  Depends on'),
      expect.ignoreColor(/[a-f0-9]{6} {2}yarn run build {2}wks-c/),
      expect.ignoreColor(/[a-f0-9]{6} {2}yarn run start {2}wks-b {13}[a-f0-9]{6}/),
    ]);

    await expect(fileExists(path.join(prjDir, 'wks-c', 'script.txt'))).resolves.toBe(false);
    await expect(fileExists(path.join(prjDir, 'wks-b', 'script.txt'))).resolves.toBe(false);
  });
});
