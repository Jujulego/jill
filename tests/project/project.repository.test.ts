import { fs, vol } from 'memfs';
import path from 'node:path';

import { container } from '@/src/inversify.config';
import { ProjectRepository } from '@/src/project/project.repository';

// Mocks
jest.mock('fs', () => fs);
jest.mock('node:fs/promises', () => fs.promises);

// Setup
let repository: ProjectRepository;

beforeAll(() => {
  container.snapshot();
});

beforeEach(() => {
  container.restore();
  container.snapshot();

  repository = container.get(ProjectRepository);

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
});

afterEach(() => {
  vol.reset();
});

// Tests
describe('ProjectRepository.searchProjectRoot', () => {
  // root search
  it('should return /test for /test (yarn lockfile)', async ()=> {
    jest.spyOn(repository, 'isProjectRoot');

    // Add lockfile
    vol.fromJSON({ 'yarn.lock': '' }, '/test');

    // Test
    await expect(repository.searchProjectRoot('/test'))
      .resolves.toBe(path.resolve('/test'));

    expect(repository.isProjectRoot).toHaveBeenCalledTimes(1);
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/test'));
  });

  it('should return /test for /test (npm lockfile)', async ()=> {
    jest.spyOn(repository, 'isProjectRoot');

    // Add lockfile
    vol.fromJSON({ 'package-lock.json': '' }, '/test');

    // Test
    await expect(repository.searchProjectRoot('/test'))
      .resolves.toBe(path.resolve('/test'));

    expect(repository.isProjectRoot).toHaveBeenCalledTimes(1);
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/test'));
  });

  it('should return /test for /test (package.json manifest)', async ()=> {
    jest.spyOn(repository, 'isProjectRoot');

    // Test
    await expect(repository.searchProjectRoot('/test'))
      .resolves.toBe(path.resolve('/test'));

    expect(repository.isProjectRoot).toHaveBeenCalledTimes(2);
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/test'));
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/'));
  });

  it('should return /test for /test/workspaces/wks-a (yarn lockfile)', async ()=> {
    jest.spyOn(repository, 'isProjectRoot');

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
    jest.spyOn(repository, 'isProjectRoot');

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
    jest.spyOn(repository, 'isProjectRoot');

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
    jest.spyOn(repository, 'isProjectRoot');

    // Add file
    vol.fromJSON({ 'test.txt': '' }, '/toto/tata/tutu');

    // Test
    await expect(repository.searchProjectRoot('/toto/tata/tutu'))
      .resolves.toBe(path.resolve('/toto/tata/tutu'));

    expect(repository.isProjectRoot).toHaveBeenCalledTimes(4);
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/toto/tata/tutu'));
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/toto/tata'));
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/toto'));
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/'));
  });

  // cache
  it('should take advantage of cache', async ()=> {
    jest.spyOn(repository, 'isProjectRoot');

    // Test
    await expect(repository.searchProjectRoot('/test/workspaces'))
      .resolves.toBe(path.resolve('/test'));

    expect(repository.isProjectRoot).toHaveBeenCalledTimes(3);
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/test/workspaces'));
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/test'));
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/'));

    // Check cache
    jest.mocked(repository.isProjectRoot).mockReset();

    await expect(repository.searchProjectRoot('/test/workspaces/wks-a'))
      .resolves.toBe(path.resolve('/test'));

    expect(repository.isProjectRoot).toHaveBeenCalledTimes(1);
    expect(repository.isProjectRoot).toHaveBeenCalledWith(path.resolve('/test/workspaces/wks-a'));
  });
});
