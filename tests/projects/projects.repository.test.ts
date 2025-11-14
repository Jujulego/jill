import { Project } from '@/src/projects/project.js';
import { ProjectsRepository } from '@/src/services/projects.repository.js';
import { globalScope$, inject$ } from '@kyrielle/injector';
import { vol } from 'memfs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mocks
vi.mock('node:fs', async () => {
  const { fs } = await import('memfs');
  return ({ default: fs });
});

// Setup
let repository: ProjectsRepository;

beforeEach(() => {
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

  repository = inject$(ProjectsRepository);
});

afterEach(() => {
  globalScope$().clear();
  vol.reset();
});

// Tests
describe('ProjectsRepository.searchProjectRoot', () => {
  // root search
  it('should return /test for /test (yarn lockfile)', async ()=> {
    vi.spyOn(repository, 'isProjectRoot');

    // Add lockfile
    vol.fromJSON({ 'yarn.lock': '' }, '/test');

    // Test
    await expect(repository.searchProjectRoot('/test'))
      .resolves.toBe(path.resolve('/test'));

    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/test'));
  });

  it('should return /test for /test (npm lockfile)', async ()=> {
    vi.spyOn(repository, 'isProjectRoot');

    // Add lockfile
    vol.fromJSON({ 'package-lock.json': '' }, '/test');

    // Test
    await expect(repository.searchProjectRoot('/test'))
      .resolves.toBe(path.resolve('/test'));

    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/test'));
  });

  it('should return /test for /test (package.json manifest)', async ()=> {
    vi.spyOn(repository, 'isProjectRoot');

    // Test
    await expect(repository.searchProjectRoot('/test'))
      .resolves.toBe(path.resolve('/test'));

    expect(repository.isProjectRoot).toHaveBeenCalledTimes(2);
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/test'));
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/'));
  });

  it('should return /test for /test/workspaces/wks-a (yarn lockfile)', async ()=> {
    vi.spyOn(repository, 'isProjectRoot');

    // Add lockfile
    vol.fromJSON({ 'yarn.lock': '' }, '/test');

    // Test
    await expect(repository.searchProjectRoot('/test/workspaces/wks-a'))
      .resolves.toBe(path.resolve('/test'));

    expect(repository.isProjectRoot).toHaveBeenCalledTimes(3);
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/test/workspaces/wks-a'));
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/test/workspaces'));
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/test'));
  });

  it('should return /test for /test/workspaces/wks-a (npm lockfile)', async ()=> {
    vi.spyOn(repository, 'isProjectRoot');

    // Add lockfile
    vol.fromJSON({ 'package-lock.json': '' }, '/test');

    // Test
    await expect(repository.searchProjectRoot('/test/workspaces/wks-a'))
      .resolves.toBe(path.resolve('/test'));

    expect(repository.isProjectRoot).toHaveBeenCalledTimes(3);
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/test/workspaces/wks-a'));
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/test/workspaces'));
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/test'));
  });

  it('should return /test for /test/workspaces/wks-a (package.json manifest)', async ()=> {
    vi.spyOn(repository, 'isProjectRoot');

    // Test
    await expect(repository.searchProjectRoot('/test/workspaces/wks-a'))
      .resolves.toBe(path.resolve('/test'));

    expect(repository.isProjectRoot).toHaveBeenCalledTimes(4);
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/test/workspaces/wks-a'));
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/test/workspaces'));
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/test'));
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/'));
  });

  it('should return /toto/tata/tutu for /toto/tata/tutu (nothing found)', async () => {
    vi.spyOn(repository, 'isProjectRoot');

    // Add file
    vol.fromJSON({ 'test.txt': '' }, '/toto/tata/tutu');

    // Test
    await expect(repository.searchProjectRoot('/toto/tata/tutu'))
      .resolves.toBe(path.resolve('/toto/tata/tutu'));

    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/toto/tata/tutu'));
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/toto/tata'));
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/toto'));
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/'));
  });
});

describe('ProjectsRepository.getProject', () => {
  it('should create a Project with given parameters', () => {
    const prj = repository.getProject('/test');

    expect(prj).toBeInstanceOf(Project);
    expect(prj.root).toBe(path.resolve('/test'));
  });

  it('should cache Project instances', () => {
    const prjA = repository.getProject('/test');
    const prjB = repository.getProject('/test');

    expect(prjA).toBe(prjB);
  });
});
