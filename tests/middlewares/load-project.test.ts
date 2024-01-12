import { Logger } from '@jujulego/logger';
import path from 'node:path';
import yargs, { Argv } from 'yargs';
import { vi } from 'vitest';

import '@/src/commons/logger.service.js';
import { CURRENT } from '@/src/constants.js';
import { ContextService } from '@/src/commons/context.service.js';
import { container } from '@/src/inversify.config.js';
import { LoadProject } from '@/src/middlewares/load-project.js';
import { applyMiddlewares } from '@/src/modules/middleware.js';
import { Project } from '@/src/project/project.js';
import { ProjectRepository } from '@/src/project/project.repository.js';

// Setup
let parser: Argv;
let context: ContextService;
let projectRepo: ProjectRepository;

beforeAll(() => {
  container.snapshot();
});

beforeEach(() => {
  container.restore();
  container.snapshot();

  context = container.get(ContextService);

  projectRepo = container.get(ProjectRepository);
  vi.spyOn(projectRepo, 'searchProjectRoot')
    .mockResolvedValue(path.resolve('/test'));

  parser = applyMiddlewares(yargs(), [LoadProject]);
});

// Tests
describe('LoadProject', () => {
  it('should search project root using cwd', async () => {
    context.reset();

    const parsed = await parser.parse(''); // <= no args

    expect(projectRepo.searchProjectRoot).toHaveBeenCalledWith(process.cwd());

    expect(context.project).toBeInstanceOf(Project);
    expect(context.project?.root).toBe(path.resolve('/test'));
    expect(parsed.project).toBe(path.resolve('/test'));
  });

  it('should search project root using arguments', async () => {
    context.reset();
    await parser.parse('-p /toto');

    expect(projectRepo.searchProjectRoot).toHaveBeenCalledWith('/toto');
  });

  it('should set package manager using arguments', async () => {
    context.reset();
    await parser.parse('--package-manager npm');

    expect(context.project).toBeInstanceOf(Project);
    await expect(context.project?.packageManager())
      .resolves.toBe('npm');
  });

  it('should keep project from context if no args are provided', async () => {
    const project = new Project('/parent', container.get(Logger));
    context.reset({ project });

    const parsed = await parser.parse(''); // <= no args

    expect(projectRepo.searchProjectRoot).not.toHaveBeenCalled();

    expect(context.project).toBe(project);
    expect(parsed.project).toBe(project.root);
  });

  it('should replace project in context if args are provided', async () => {
    const project = new Project('/parent', container.get(Logger));
    context.reset({ project });

    const parsed = await parser.parse('-p /test');

    expect(projectRepo.searchProjectRoot).toHaveBeenCalledWith('/test');

    expect(context.project).not.toBe(project);
    expect(context.project?.root).toBe(path.resolve('/test'));
    expect(parsed.project).toBe(path.resolve('/test'));
  });
});

describe('Project CURRENT binding', () => {
  it('should return project from context', () => {
    // Set project in context
    const project = new Project('/test', container.get(Logger));
    context.reset({ project });

    // Use binding
    expect(container.getNamed(Project, CURRENT)).toBe(project);
  });

  it('should throw if project miss in context', () => {
    // Set project in context
    context.reset();

    // Use binding
    expect(() => container.getNamed(Project, CURRENT))
      .toThrow(new Error('Cannot inject current project, it not yet defined'));
  });
});
