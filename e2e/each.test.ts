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

  prjDir = await bed.createProjectPackage();
});

afterEach(async () => {
  await fs.rm(prjDir, { recursive: true });
});

// Tests
describe('jill each', () => {
  it('should run start script on each workspace (and build dependencies)', async () => {
    const res = await jill(['each', 'start'], { cwd: prjDir });

    // Check jill output
    expect(res.code).toBe(0);
    expect(res.screen.screen).toMatchLines([
      expect.ignoreColor(/. Running build in wks-c \(took [0-9]+ms\)/),
      expect.ignoreColor(/. Running start in wks-b \(took [0-9]+ms\)/),
      expect.ignoreColor(/. Running build in wks-b \(took [0-9]+ms\)/),
      expect.ignoreColor(/. Running start in wks-a \(took [0-9]+ms\)/),
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
      expect.ignoreColor(/. Running build in wks-c \(took [0-9]+ms\)/),
      expect.ignoreColor(/. Running fails in wks-b \(took [0-9]+ms\)/),
    ]);

    // Check script result
    await expect(fs.readFile(path.join(prjDir, 'wks-c', 'build.txt'), 'utf8'))
      .resolves.toBe('built');
  });
});
