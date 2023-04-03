import path from 'node:path';
import yargs from 'yargs';

import { ContextService } from '@/src/commons/context.service';
import { Logger } from '@/src/commons/logger.service';
import { SpinnerService } from '@/src/commons/spinner.service';
import { CURRENT } from '@/src/constants';
import { container } from '@/src/inversify.config';
import { LoadProject } from '@/src/middlewares/load-project';
import { applyMiddlewares } from '@/src/modules/middleware';
import { Project } from '@/src/project/project';
import { ProjectRepository } from '@/src/project/project.repository';

// Setup
let parser: yargs.Argv;
let context: ContextService;
let spinner: SpinnerService;
let projectRepo: ProjectRepository;

beforeAll(() => {
  container.snapshot();
});

beforeEach(() => {
  container.restore();
  container.snapshot();

  context = container.get(ContextService);
  spinner = container.get(SpinnerService);
  jest.spyOn(spinner, 'spin');
  jest.spyOn(spinner, 'stop');

  projectRepo = container.get(ProjectRepository);
  jest.spyOn(projectRepo, 'searchProjectRoot')
    .mockResolvedValue('/test');

  parser = applyMiddlewares(yargs(), [LoadProject]);
});

// Tests
describe('LoadProject', () => {
  it('should search project root using cwd', async () => {
    context.reset();
    await parser.parse(''); // <= no args

    expect(spinner.spin).toHaveBeenCalledWith('Loading project ...');
    expect(projectRepo.searchProjectRoot).toHaveBeenCalledWith(process.cwd());

    expect(context.project).toBeInstanceOf(Project);
    expect(context.project?.root).toBe(path.resolve('/test'));

    expect(spinner.stop).toHaveBeenCalled();
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
