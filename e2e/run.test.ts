import fs from 'node:fs/promises';
import path from 'node:path';

import { TestBed } from '@/tools/test-bed';

import { jill } from './utils';

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

  prjDir = await bed.createProjectPackage();
});

afterEach(async () => {
  await fs.rm(prjDir, { recursive: true });
});

// Tests
describe('jill run', () => {
  it('should run wks-c build script', async () => {
    const res = await jill(['run', '-w', 'wks-c', 'start'], { cwd: prjDir });

    // Check jill output
    expect(res.code).toBe(0);
    expect(res.screen.screen).toMatchLines([
      expect.ignoreColor(/. Running start in wks-c \(took [0-9]+ms\)/),
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
      expect.ignoreColor(/. Running fails in wks-c \(took [0-9]+ms\)/),
    ]);
  });

  it('should run wks-b start script and build script', async () => {
    const res = await jill(['run', '-w', 'wks-b', 'start'], { cwd: prjDir });

    // Check jill output
    expect(res.code).toBe(0);
    expect(res.screen.screen).toMatchLines([
      expect.ignoreColor(/. Running build in wks-c \(took [0-9]+ms\)/),
      expect.ignoreColor(/. Running start in wks-b \(took [0-9]+ms\)/),
    ]);

    // Check scripts result
    await expect(fs.readFile(path.join(prjDir, 'wks-c', 'script.txt'), 'utf8'))
      .resolves.toBe('build');

    await expect(fs.readFile(path.join(prjDir, 'wks-b', 'script.txt'), 'utf8'))
      .resolves.toBe('start');
  });
});
