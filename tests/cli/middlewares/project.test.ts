import { loadProject, withProject } from '@/src/middlewares/project.js';
import { ProjectsRepository } from '@/src/projects/projects.repository.js';
import { CWD } from '@/src/tokens.js';
import { TestBed } from '@/tools/test-bed.js';
import { globalScope$, inject$ } from '@kyrielle/injector';
import { pipe$ } from 'kyrielle';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import yargs from 'yargs';

// Setup
let bed: TestBed;
let projectsRepository: ProjectsRepository;

beforeEach(() => {
  vi.resetAllMocks();

  bed = new TestBed();
  projectsRepository = inject$(ProjectsRepository);

  vi.spyOn(projectsRepository, 'searchProjectRoot').mockResolvedValue(bed.project.root);
  vi.spyOn(projectsRepository, 'getProject').mockReturnValue(bed.project);
});

afterEach(() => {
  globalScope$().clear();
});

// Tests
describe('project cli middleware', () => {
  it('should search from current directory', async () => {
    // Argument parsing
    const cwd = path.join(bed.project.root, 'cwd');
    globalScope$().set(CWD, cwd);

    const args = await pipe$(yargs(), withProject).parseAsync('');

    expect(args.project).toBe(bed.project.root);
    expect(projectsRepository.searchProjectRoot).toHaveBeenCalledWith(cwd);

    // Load project
    expect(loadProject(args)).toBe(bed.project);

    expect(projectsRepository.getProject).toHaveBeenCalledWith(bed.project.root, {
      packageManager: undefined,
    });
  });

  it('should search from given directory', async () => {
    // Argument parsing
    const cwd = path.join(bed.project.root, 'cwd');
    globalScope$().set(CWD, cwd);

    const args = await pipe$(yargs(), withProject).parseAsync('--project toto');

    expect(args.project).toBe(bed.project.root);
    expect(projectsRepository.searchProjectRoot).toHaveBeenCalledWith(path.join(cwd, 'toto'));

    // Load project
    expect(loadProject(args)).toBe(bed.project);

    expect(projectsRepository.getProject).toHaveBeenCalledWith(bed.project.root, {
      packageManager: undefined,
    });
  });

  it('should use given package manager', async () => {
    // Argument parsing
    const args = await pipe$(yargs(), withProject).parseAsync('--package-manager npm');

    // Load project
    expect(loadProject(args)).toBe(bed.project);

    expect(projectsRepository.getProject).toHaveBeenCalledWith(bed.project.root, {
      packageManager: 'npm',
    });
  });
});