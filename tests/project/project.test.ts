import { fs, vol } from 'memfs';
import path from 'node:path';
import { vi } from 'vitest';

import { container } from '@/src/inversify.config.js';
import { Logger } from '@/src/commons/logger.service.js';
import { Project } from '@/src/project/project.js';
import { Workspace } from '@/src/project/workspace.js';

// Mocks
vi.mock('node:fs', () => ({ default: fs }));
vi.mock('node:fs/promises', () => ({ default: fs.promises }));

// Setup
let project: Project;
let logger: Logger;

beforeAll(async () => {
  container.snapshot();
});

beforeEach(async () => {
  container.snapshot();

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
  logger = container.get(Logger).child({ label: 'projects' });
  project = new Project('/test', logger);
});

afterEach(() => {
  vol.reset();
  container.restore();
});

// Test suites
describe('Project.mainWorkspace', () => {
  // Tests
  it('should return root workspace', async () => {
    await expect(project.mainWorkspace())
      .resolves.toBeInstanceOf(Workspace);

    await expect(project.mainWorkspace())
      .resolves.toMatchObject({
        cwd: path.resolve('/test'),
        name: 'main',
        project: project
      });
  });
});

describe('Project.currentWorkspace', () => {
  it('should return wks-a', async () => {
    await expect(project.currentWorkspace('/test/workspaces/wks-a/src'))
      .resolves.toMatchObject({
        name: 'wks-a'
      });
  });

  it('should return main workspace', async () => {
    await expect(project.currentWorkspace('/test/tools'))
      .resolves.toMatchObject({
        name: 'main'
      });
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

    await expect(project.workspace())
      .resolves.toMatchObject({
        name: 'wks-a',
        cwd: path.resolve('/test/workspaces/wks-a')
      });
  });

  it('should return named workspace', async () => {
    await expect(project.workspace('wks-a'))
      .resolves.toMatchObject({
        name: 'wks-a',
        cwd: path.resolve('/test/workspaces/wks-a')
      });
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
    const prj = new Project('/test', logger, { packageManager: 'yarn' });

    // Test
    await expect(prj.packageManager())
      .resolves.toBe('yarn');
  });
});
