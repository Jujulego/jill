import { Project } from '@/src/projects/project.js';
import { globalScope$ } from '@kyrielle/injector';
import { vol } from 'memfs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mocks
vi.mock('node:fs', async () => {
  const { fs } = await import('memfs');
  return ({ default: fs });
});

// Setup
let project: Project;

beforeEach(async () => {
  // Create project structure
  vol.fromNestedJSON({
    'workspaces': {
      'wks-a': {
        'package.json': JSON.stringify({
          name: 'wks-a',
          dependencies: {
            'wks-b': '*',
          },
          devDependencies: {
            'wks-c': '*',
          },
        }),
      },
      'wks-b': {
        'package.json': JSON.stringify({
          name: 'wks-b',
          devDependencies: {
            'wks-c': '*',
          },
        }),
      },
      'wks-c': {
        'package.json': JSON.stringify({
          name: 'wks-c',
        }),
      },
      'empty': {
        'text.txt': ''
      },
      'just-a-file.txt': ''
    },
    'package.json': JSON.stringify({
      name: 'main',
      workspaces: ['workspaces/*'],
    }),
  }, '/test');

  // Initiate project
  project = new Project('/test');
});

afterEach(() => {
  globalScope$().clear();
  vol.reset();
});

// Test suites
describe('Project.mainWorkspace', () => {
  // Tests
  it('should return root workspace', async () => {
    const wks = await project.mainWorkspace();

    expect(wks.root).toBe(path.resolve('/test'));
    expect(wks.name).toBe('main');
    expect(wks.project).toBe(project);
  });
});

describe('Project.currentWorkspace', () => {
  it('should return wks-a', async () => {
    const wks = await project.currentWorkspace('/test/workspaces/wks-a/src');

    expect(wks?.name).toBe('wks-a');
  });

  it('should return main workspace', async () => {
    const wks = await project.currentWorkspace('/test/tools');
    expect(wks?.name).toBe('main');
  });

  it('should return null', async () => {
    await expect(project.currentWorkspace('/out'))
      .resolves.toBeNull();
  });
});

describe('Project.workspaces', () => {
  // Tests
  it('should yield all workspaces', async () => {
    await expect(project.workspaces()).toYield([
      expect.objectContaining({ name: 'main' }),
      expect.objectContaining({ name: 'wks-c' }),
      expect.objectContaining({ name: 'wks-b' }),
      expect.objectContaining({ name: 'wks-a' }),
    ]);
  });
});

describe('Project.workspace', () => {
  // Tests
  it('should return current directory workspace', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/test/workspaces/wks-a');

    const wks = await project.workspace();

    expect(wks?.name).toBe('wks-a');
    expect(wks?.root).toBe(path.resolve('/test/workspaces/wks-a'));
  });

  it('should return named workspace', async () => {
    const wks = await project.workspace('wks-a');

    expect(wks?.name).toBe('wks-a');
    expect(wks?.root).toBe(path.resolve('/test/workspaces/wks-a'));
  });

  it('should return null for unknown workspace', async () => {
    await expect(project.workspace('does-not-exists'))
      .resolves.toBeNull();
  });
});

describe('Project.packageManager', () => {
  it('should return \'yarn\'', async () => {
    vol.fromJSON({
      'yarn.lock': '',
    }, '/test');

    // Test
    await expect(project.packageManager())
      .resolves.toBe('yarn');
  });

  it('should return \'npm\'', async () => {
    vol.fromJSON({
      'package-lock.json': '',
    }, '/test');

    // Test
    await expect(project.packageManager())
      .resolves.toBe('npm');
  });

  it('should return \'npm\' (nothing recognized)', async () => {
    // Test
    await expect(project.packageManager())
      .resolves.toBe('npm');
  });

  it('should return packageManager from options', async () => {
    const prj = new Project('/test', { packageManager: 'yarn' });

    // Test
    await expect(prj.packageManager())
      .resolves.toBe('yarn');
  });
});
