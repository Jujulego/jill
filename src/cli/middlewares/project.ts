import { asyncScope$, inject$ } from '@kyrielle/injector';
import path from 'node:path';
import { type ArgumentsCamelCase, type Argv } from 'yargs';
import type { Project } from '../../projects/project.js';
import { ProjectsRepository } from '../../projects/projects.repository.js';
import { CWD } from '../../tokens.js';
import type { PackageManager, Writable } from '../../utils/types.js';

/**
 * Adds arguments to load a project.
 */
export function withProject<T = unknown>(parser: Argv<T>): Argv<T & ProjectArgs> {
  return parser
    .option('project', {
      alias: 'p',
      type: 'string',
      default: '',
      defaultDescription: 'current working directory',
      description: 'Project root directory',
      normalize: true,
    })
    .option('package-manager', {
      choices: ['yarn', 'npm'] as const,
      type: 'string',
      description: 'Force package manager'
    })
    .middleware(async (args: ArgumentsCamelCase<Writable<ProjectArgs>>) => {
      const repository = inject$(ProjectsRepository);
      const directory = path.resolve(inject$(CWD, asyncScope$()), args.project);

      args.project = await repository.searchProjectRoot(directory);
    });
}

/**
 * Loads a project, based on arguments.
 */
export function loadProject(args: ArgumentsCamelCase<ProjectArgs>): Project {
  const repository = inject$(ProjectsRepository);

  return repository.getProject(args.project, {
    packageManager: args.packageManager
  });
}

// Types
export interface ProjectArgs {
  readonly project: string;
  readonly 'package-manager': PackageManager | undefined;
}
